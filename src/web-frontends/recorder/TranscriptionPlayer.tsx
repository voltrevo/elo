import * as preact from 'preact';

import type { Analysis, AnalysisToken } from '../../analyze';
import { Settings } from './App';
import audio from './audio';

type Props = {
  data: {
    recording?: audio.Recording,
    analysis: Analysis,
  },
  settings: Settings,
  onDelete: () => void,
};

type State = {
  time: number,
  playing: boolean,
  duration?: number,
};

type CursorPos = {
  x: number,
  top: number,
  bottom: number,
};

type ExpandedToken = AnalysisToken | null;

export default class TranscriptionPlayer extends preact.Component<Props, State> {
  state: State = {
    playing: false,
    time: 0,
  };

  // TODO: Store these on app?
  audioElement: HTMLAudioElement | null = null;

  tokenRefs: (HTMLSpanElement | null)[] = [];

  cursorStartRef: HTMLSpanElement | null = null;
  cursorEndRef: HTMLSpanElement | null = null;

  async playPause() {
    const recording = this.props.data.recording;

    if (recording === undefined) {
      console.log("Can't play without recording");
      return;
    }

    if (this.state.playing) {
      this.setState({
        playing: false,
      });

      if (this.audioElement) {
        this.audioElement.pause();
      }

      return;
    }

    this.setState({
      playing: true,
    });

    if (this.audioElement === null) {
      this.audioElement = document.createElement('audio');
      const url = URL.createObjectURL(recording.data);
      this.audioElement.src = url;
      document.body.append(this.audioElement);
    }

    const audioElement = this.audioElement;

    audioElement.currentTime = this.state.time;

    await audioElement.play();

    let startTime = Date.now() - this.state.time * 1000;

    audioElement.ontimeupdate = () => {
      const predictedTime = (Date.now() - startTime) / 1000;
      const actualTime = audioElement.currentTime;
      startTime -= (actualTime - predictedTime) * 1000;
    };

    const updateTimeLoop = () => {
      if (this.state.playing === false) {
        return;
      }

      this.setState({ time: (Date.now() - startTime) / 1000 });
      window.requestAnimationFrame(updateTimeLoop);
    };

    window.requestAnimationFrame(updateTimeLoop);

    await new Promise<void>(resolve => {
      audioElement.onended = () => {
        URL.revokeObjectURL(audioElement.src);
        audioElement.remove();
        this.audioElement = null;
        resolve();
      };
    });

    this.setState({
      playing: false,
      time: 0,
    });
  }

  getTokens(): AnalysisToken[] {
    return this.props.data.analysis.tokens;
  }

  findCursorPos(): CursorPos | null {
    const tokens = this.getTokens();

    const cursorTime = this.state.time + this.props.settings.cursorCorrection;

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
        t: this.props.data.analysis.duration,
        top: rect.top,
        bottom: rect.bottom,
      };
    }

    for (const [iStr, tokenRef] of Object.entries(this.tokenRefs)) {
      const i = Number(iStr);
      const token = tokens[i];

      if (!tokenRef || typeof token?.start_time !== 'number' || tokenRef.parentElement === null) {
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

    const progress = leftDetails.t === rightDetails.t ? 0.5 : Math.min(1, (
      (cursorTime - leftDetails.t) /
      (rightDetails.t - leftDetails.t)
    ));

    return {
      x: leftDetails.x + progress * (rightDetails.x - leftDetails.x),
      top: leftDetails.top + progress * (rightDetails.top - leftDetails.top),
      bottom: leftDetails.bottom + progress * (rightDetails.bottom - leftDetails.bottom),
    };
  }

  getExpandedTokens(): ExpandedToken[] {
    const tokens = this.getTokens();
    const expandedTokens: ExpandedToken[] = [];
    let prevToken: (AnalysisToken & { start_time: number }) | null = null;

    for (const token of tokens) {
      if (typeof token.start_time !== 'number') {
        expandedTokens.push(token);
      } else {
        let gap = token.start_time - (prevToken?.start_time ?? 0);

        if (this.props.settings.maximumGap !== null) {
          while (gap > this.props.settings.maximumGap) {
            expandedTokens.push(null);
            gap -= this.props.settings.maximumGap;
          }
        }

        expandedTokens.push(token);
        prevToken = { ...token, start_time: token.start_time };
      }
    }

    const lastToken = prevToken;

    if (this.props.settings.maximumGap !== null && lastToken) {
      let gap = this.props.data.analysis.duration - lastToken.start_time;

      while (gap > this.props.settings.maximumGap) {
        expandedTokens.push(null);
        gap -= this.props.settings.maximumGap;
      }
    }

    return expandedTokens;
  }

  renderTranscript(): preact.JSX.Element {
    const expandedTokens = this.getExpandedTokens();

    return <div>
      {expandedTokens.map(t => {
        if (t === null) {
          return <span> </span>;
        }

        const startTime = t.start_time;

        return <span
          class="token"
          ref={r => {
            this.tokenRefs[expandedTokens.indexOf(t)] = r;
          }}
          onClick={startTime === null ? undefined : (() => {
            this.setState({
              time: startTime - this.props.settings.cursorCorrection,
            });
          })}
        >
          {t.text ?? ' '}
        </span>;
      })}
    </div>;
  }

  render() {
    const cursorPos = this.findCursorPos();

    if (cursorPos) {
      const cursorEl = document.createElement('div');
      cursorEl.classList.add('transcription-cursor', 'fade-out');
      document.body.appendChild(cursorEl);

      cursorEl.style.left = `${cursorPos.x}px`;
      cursorEl.style.top = `${cursorPos.bottom + 2}px`;

      setTimeout(() => {
        cursorEl.remove();
      }, 250);
    }

    const textClasses = ['transcription-text'];

    if (this.props.settings.monospace) {
      textClasses.push('monospace');
    }

    const panel = <div class="transcription-player panel">
      <div class="play-btn" onClick={() => this.playPause()}>
        <div class="play-btn-text">{this.state.playing ? '| |' : '▶'}</div>
      </div>
      <div class="transcription-box">
        <div class={textClasses.join(' ')}>{this.renderTranscript()}</div>
        {(() => {
          const recording = this.props.data.recording;

          if (recording === undefined) {
            return null;
          }

          return <div
            style={{
              position: 'absolute',
              right: '0.2em',
              bottom: '0.2em',
            }}
            onClick={() => {
              const url = URL.createObjectURL(recording.data);
              download('recording.webm', url);
              URL.revokeObjectURL(url);
            }}
          >
            ⬇️
          </div>;
        })()}
        <div
          style={{
            position: 'absolute',
            right: '0.2em',
            top: '0.2em',
          }}
          onClick={this.props.onDelete}
        >
          ❌
        </div>
        <div
          style={{
            position: 'absolute',
            right: '2em',
            top: '0.5em',
          }}
        >
          <i>
            {this.props.data.analysis.words.filter(w => w.disfluent).length} disfluent(s)
          </i>
        </div>
      </div>
    </div>;

    return <>
      {panel}
      {cursorPos && <div
        class="transcription-cursor"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.bottom + 2}px`,
        }}
      />}
    </>;
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

function download(filename: string, url: string) {
  const element = document.createElement('a');
  element.setAttribute('href', url);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
