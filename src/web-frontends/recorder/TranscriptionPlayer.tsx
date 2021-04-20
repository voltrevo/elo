import type { TokenMetadata } from 'deepspeech';
import * as preact from 'preact';

import { Analysis } from '../../analyze';
import audio from './audio';

type Props = {
  data: {
    recording: audio.Recording,
    analysis: Analysis,
  },
};

type State = {
  playback: (
    { playing: false } |
    { playing: true, time: number }
  ),
  totalTime?: number,
};

export default class TranscriptionPlayer extends preact.Component<Props, State> {
  state: State = {
    playback: {
      playing: false,
    },
  };

  tokenRefs: (HTMLSpanElement | null)[] = [];
  textRef: HTMLDivElement | null = null;

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
        totalTime: Number.isFinite(audioElement.duration)
          ? audioElement.duration
          : this.state.totalTime,
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

  render() {
    const [transcript] = this.props.data.analysis.transcripts;

    let leftDetails: { x: number, t: number, top: number, bottom: number } | null = null;
    let rightDetails: { x: number, t: number } | null = null;

    let cursorPos: { x: number, top: number, bottom: number } | null = null;

    if (this.state.playback.playing) {
      for (const [iStr, tokenRef] of Object.entries(this.tokenRefs)) {
        if (!tokenRef) {
          continue;
        }

        const i = Number(iStr);

        if (transcript.tokens[i].start_time <= this.state.playback.time) {
          const rect = tokenRef.getBoundingClientRect();

          leftDetails = {
            x: 0.5 * (rect.left + rect.right),
            t: transcript.tokens[i].start_time,
            top: rect.top,
            bottom: rect.bottom,
          };
        }

        if (transcript.tokens[i].start_time >= this.state.playback.time) {
          const rect = tokenRef.getBoundingClientRect();

          rightDetails = {
            x: 0.5 * (rect.left + rect.right),
            t: transcript.tokens[i].start_time,
          };

          break;
        }
      }

      if (!rightDetails && this.textRef && this.state.totalTime !== undefined) {
        const rect = this.textRef.getBoundingClientRect();

        rightDetails = {
          x: rect.right,
          t: this.state.totalTime,
        };
      }

      if (!leftDetails && this.textRef) {
        const rect = this.textRef.getBoundingClientRect();

        leftDetails = {
          x: rect.left,
          t: 0,
          top: rect.top,
          bottom: rect.bottom - 1,
        };
      }

      if (leftDetails && rightDetails) {
        const progress = (
          (this.state.playback.time - leftDetails.t) /
          (rightDetails.t - leftDetails.t)
        );

        cursorPos = {
          x: leftDetails.x + progress * (rightDetails.x - leftDetails.x),
          top: leftDetails.top,
          bottom: leftDetails.bottom,
        };
      } else if (!leftDetails && rightDetails && this.textRef) {
        const rect = this.textRef.getBoundingClientRect();

        cursorPos = {
          x: rect.left,
          top: rect.top,
          bottom: rect.bottom - 1,
        };
      }
    }

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

    const maximumGap = 0.15; // seconds between tokens

    const expandedTokens: (preact.JSX.Element | TokenMetadata)[] = [];
    let prevToken: TokenMetadata | null = null;

    for (const token of transcript.tokens) {
      let gap = token.start_time - (prevToken?.start_time ?? 0);

      while (gap > maximumGap) {
        expandedTokens.push(<>&nbsp;</>);
        gap -= maximumGap;
      }

      expandedTokens.push(token);
      prevToken = token;
    }

    const lastToken = transcript.tokens[transcript.tokens.length - 1];

    if (lastToken && this.state.totalTime !== undefined) {
      let gap = this.state.totalTime - lastToken.start_time;

      while (gap > maximumGap) {
        expandedTokens.push(<>&nbsp;</>);
        gap -= maximumGap;
      }
    }

    return <div class="transcription-player" style={{ display: 'flex', flexDirection: 'row' }}>
      <div class="clickable play-btn" onClick={() => this.play()}>
        <div class="play-btn-text">{this.state.playback.playing ? '| |' : '▶'}</div>
      </div>
      <div class="transcription-box" style={{ flexGrow: 1 }}>
        <div class="transcription-text" ref={r => { this.textRef = r; }}>
          {expandedTokens.map((t) => (
            'start_time' in t
              ? <span class="token" ref={r => { this.tokenRefs[transcript.tokens.indexOf(t)] = r; }}>{t.text}</span>
              : t
          ))}
        </div>
      </div>
    </div>;
  }
}
