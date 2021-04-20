import type { TokenMetadata } from 'deepspeech';
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
    let rightDetails: { x: number, t: number } | null = null;

    if (this.cursorStartRef) {
      const rect = this.cursorStartRef.getBoundingClientRect();

      leftDetails = {
        x: 0.5 * (rect.left + rect.right),
        t: 0,
        top: rect.top,
        bottom: rect.bottom,
      };
    }

    if (this.cursorEndRef) {
      const rect = this.cursorEndRef.getBoundingClientRect();

      rightDetails = {
        x: rect.right,
        t: this.props.data.recording.duration / 1000,
      };
    }

    for (const [iStr, tokenRef] of Object.entries(this.tokenRefs)) {
      if (!tokenRef) {
        continue;
      }

      const i = Number(iStr);

      if (tokens[i].start_time <= cursorTime) {
        const rect = tokenRef.getBoundingClientRect();

        leftDetails = {
          x: 0.5 * (rect.left + rect.right),
          t: tokens[i].start_time,
          top: rect.top,
          bottom: rect.bottom,
        };
      }

      if (tokens[i].start_time >= cursorTime) {
        const rect = tokenRef.getBoundingClientRect();

        rightDetails = {
          x: 0.5 * (rect.left + rect.right),
          t: tokens[i].start_time,
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
      top: leftDetails.top,
      bottom: leftDetails.bottom,
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
    let prevToken: TokenMetadata | null = null;

    for (const token of tokens) {
      let gap = token.start_time - (prevToken?.start_time ?? 0);

      while (gap > this.props.maximumGap) {
        expandedTokens.push(null);
        gap -= this.props.maximumGap;
      }

      expandedTokens.push(token);
      prevToken = token;
    }

    const lastToken = tokens[tokens.length - 1];

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

      if (token !== null && 'start_time' in token) {
        if (token.correct === false) {
          classes.push('incorrect');
        }

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

      if (i !== 0 && i !== expandedTokens.length - 1) {
        return ' ';
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
        &nbsp;
      </span>;
    };

    return <div class="transcription-player panel">
      <div class="play-btn" onClick={() => this.play()}>
        <div class="play-btn-text">{this.state.playback.playing ? '| |' : '▶'}</div>
      </div>
      <div class="transcription-box">
        <div class="transcription-text">
          {expandedTokens.map((t, i) => renderExpandedToken(i))}
        </div>
      </div>
    </div>;
  }
}
