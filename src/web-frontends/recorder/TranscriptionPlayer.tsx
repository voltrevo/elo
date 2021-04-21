import * as preact from 'preact';

import type { Analysis, AnalysisToken } from '../../analyze';
import audio from './audio';

type Props = {
  data: {
    recording: audio.Recording,
    analysis: Analysis,
  },
  maximumGap: number,
  cursorCorrection: number,
  monospace: boolean,
};

type State = {
  playback: (
    { playing: false } |
    { playing: true, time: number }
  ),
  loadedTotalTime?: number,
};

type CursorPos = {
  x: number,
  top: number,
  bottom: number,
};

export default class TranscriptionPlayer extends preact.Component<Props, State> {
  state: State = {
    playback: {
      playing: false,
    },
  };

  tokenRefs: (HTMLSpanElement | null)[] = [];

  cursorStartRef: HTMLSpanElement | null = null;
  cursorEndRef: HTMLSpanElement | null = null;

  async play() {
    if (this.state.playback.playing) {
      return;
    }

    this.setState({
      playback: {
        playing: true,
        time: 0,
      },
    });

    const audioElement = document.createElement('audio');
    const url = URL.createObjectURL(this.props.data.recording.blob);
    audioElement.src = url;

    document.body.append(audioElement);

    await audioElement.play();

    let startTime = Date.now();

    audioElement.ontimeupdate = () => {
      const predictedTime = (Date.now() - startTime) / 1000;
      const actualTime = audioElement.currentTime;
      startTime -= (actualTime - predictedTime) * 1000;
    };

    const updateTimeLoop = () => {
      if (this.state.playback.playing === false) {
        return;
      }

      this.setState({
        playback: {
          playing: true,
          time: (Date.now() - startTime) / 1000,
        },
        loadedTotalTime: Number.isFinite(audioElement.duration)
          ? audioElement.duration
          : this.state.loadedTotalTime,
      });

      window.requestAnimationFrame(updateTimeLoop);
    };

    window.requestAnimationFrame(updateTimeLoop);

    await new Promise<void>(resolve => {
      audioElement.onended = () => {
        URL.revokeObjectURL(url);
        audioElement.remove();
        resolve();
      };
    });

    this.setState({
      playback: {
        playing: false,
      },
    });
  }

  getTokens(): AnalysisToken[] {
    if (this.props.data.analysis.target) {
      return this.props.data.analysis.target.tokens;
    }

    return this.props.data.analysis.deepspeech.transcripts[0].tokens;
  }

  findCursorPos(): CursorPos | null {
    if (!this.state.playback.playing) {
      return null;
    }

    const tokens = this.getTokens();

    const cursorTime = this.state.playback.time + this.props.cursorCorrection;

    let leftDetails: { x: number, t: number, top: number, bottom: number } | null = null;
    let rightDetails: { x: number, t: number, top: number, bottom: number } | null = null;

    if (this.cursorStartRef) {
      const rect = getBoundingPageRect(this.cursorStartRef);

      leftDetails = {
        x: rect.left,
        t: 0,
        top: rect.top,
        bottom: rect.bottom,
      };
    }

    if (this.cursorEndRef) {
      const rect = getBoundingPageRect(this.cursorEndRef);

      rightDetails = {
        x: rect.right,
        t: this.props.data.recording.duration / 1000,
        top: rect.top,
        bottom: rect.bottom,
      };
    }

    for (const [iStr, tokenRef] of Object.entries(this.tokenRefs)) {
      if (!tokenRef) {
        continue;
      }

      const i = Number(iStr);

      const token = tokens[i];

      if (token.start_time === undefined) {
        continue;
      }

      if (token.start_time <= cursorTime) {
        const rect = getBoundingPageRect(tokenRef);

        leftDetails = {
          x: 0.5 * (rect.left + rect.right),
          t: token.start_time,
          top: rect.top,
          bottom: rect.bottom,
        };
      }

      if (token.start_time >= cursorTime) {
        const rect = getBoundingPageRect(tokenRef);

        rightDetails = {
          x: 0.5 * (rect.left + rect.right),
          t: token.start_time,
          top: rect.top,
          bottom: rect.bottom,
        };

        break;
      }
    }

    if (!leftDetails || !rightDetails) {
      return null;
    }

    const progress = Math.min(1, (
      (cursorTime - leftDetails.t) /
      (rightDetails.t - leftDetails.t)
    ));

    return {
      x: leftDetails.x + progress * (rightDetails.x - leftDetails.x),
      top: leftDetails.top + progress * (rightDetails.top - leftDetails.top),
      bottom: leftDetails.bottom + progress * (rightDetails.bottom - leftDetails.bottom),
    };
  }

  render() {
    const tokens = this.getTokens();
    const cursorPos = this.findCursorPos();

    if (cursorPos) {
      const cursorEl = document.createElement('div');
      cursorEl.classList.add('transcription-cursor');
      document.body.appendChild(cursorEl);

      cursorEl.style.left = `${cursorPos.x}px`;
      cursorEl.style.top = `${cursorPos.bottom + 2}px`;

      setTimeout(() => {
        cursorEl.remove();
      }, 250);
    }

    type ExpandedToken = AnalysisToken | null;

    const expandedTokens: ExpandedToken[] = [];
    let prevToken: (AnalysisToken & { start_time: number }) | null = null;

    for (const token of tokens) {
      if (token.start_time === undefined) {
        expandedTokens.push(token);
      } else {
        let gap = token.start_time - (prevToken?.start_time ?? 0);

        while (gap > this.props.maximumGap) {
          expandedTokens.push(null);
          gap -= this.props.maximumGap;
        }

        expandedTokens.push(token);
        prevToken = { ...token, start_time: token.start_time };
      }
    }

    const lastToken = prevToken;

    if (lastToken) {
      let gap = (this.props.data.recording.duration / 1000) - lastToken.start_time;

      while (gap > this.props.maximumGap) {
        expandedTokens.push(null);
        gap -= this.props.maximumGap;
      }
    }

    const renderExpandedToken = (i: number) => {
      const token = expandedTokens[i];

      const classes = [];

      if (i === 0) {
        classes.push('text-start');
      }

      if (i === expandedTokens.length - 1) {
        classes.push('text-end');
      }

      if (token !== null && token.type !== undefined) {
        classes.push(token.type);
      }

      if (token !== null && 'start_time' in token) {
        return <span
          class={['token', ...classes].join(' ')}
          ref={r => {
            this.tokenRefs[tokens.indexOf(token)] = r;

            if (i === 0) {
              this.cursorStartRef = r;
            }

            if (i === expandedTokens.length - 1) {
              this.cursorEndRef = r;
            }
          }}
        >
          {token.text}
        </span>;
      }

      let text = token?.text ?? ' ';

      if (i !== 0 && i !== expandedTokens.length - 1) {
        if (token === null) {
          return text;
        }

        if (token.type === 'missed') {
          if (expandedTokens[i - 1]?.type === 'missed') {
            return null;
          }

          let k = i + 1;

          while (
            expandedTokens[k]?.type === 'missed' &&
            /^[a-zA-Z]$/.test(expandedTokens[k]?.text ?? '')
          ) {
            text += expandedTokens[k]?.text;
            k++;
          }

          return <span style={{ position: 'relative' }}>
            <span class={classes.join(' ')}>{text}</span>
          </span>;
        }

        return <span class={classes.join(' ')}>{text}</span>;
      }

      return <span
        class={classes.join(' ')}
        ref={r => {
          if (i === 0) {
            this.cursorStartRef = r;
          }

          if (i === expandedTokens.length - 1) {
            this.cursorEndRef = r;
          }
        }}
      >
        {text}
      </span>;
    };

    const textClasses = ['transcription-text'];

    if (this.props.monospace) {
      textClasses.push('monospace');
    }

    return <div class="transcription-player panel">
      <div class="play-btn" onClick={() => this.play()}>
        <div class="play-btn-text">{this.state.playback.playing ? '| |' : '▶'}</div>
      </div>
      <div class="transcription-box">
        <div class={textClasses.join(' ')}>
          {expandedTokens.map((t, i) => renderExpandedToken(i))}
        </div>
      </div>
    </div>;
  }
}

type Rect = {
  left: number,
  right: number,
  top: number,
  bottom: number,
}

function getBoundingPageRect(element: HTMLElement): Rect {
  const clientRect = element.getBoundingClientRect();

  return {
    left: window.scrollX + clientRect.left,
    right: window.scrollX + clientRect.right,
    top: window.scrollY + clientRect.top,
    bottom: window.scrollY + clientRect.bottom,
  };
}
