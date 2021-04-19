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
};

export default class TranscriptionPlayer extends preact.Component<Props, State> {
  state: State = {
    playback: {
      playing: false,
    },
  };

  tokenRefs: (HTMLSpanElement | null)[] = [];
  cursorEl: HTMLDivElement | null = null;

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

    this.cursorEl?.remove();
    this.cursorEl = null;

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
        if (tokenRef === null) {
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
      }
    }

    let cursorEl = this.cursorEl;

    if (cursorPos) {
      if (cursorEl === null) {
        cursorEl = document.createElement('div');
        cursorEl.classList.add('transcription-cursor');
        document.body.appendChild(cursorEl);
        this.cursorEl = cursorEl;
      }

      cursorEl.style.left = `${cursorPos.x}px`;
      cursorEl.style.top = `${cursorPos.top}px`;
      cursorEl.style.height = `${cursorPos.bottom - cursorPos.top}px`;
    } else if (cursorEl !== null) {
      cursorEl.remove();
      this.cursorEl = null;
    }

    return <div class="transcription-player" style={{ display: 'flex', flexDirection: 'row' }}>
      <div class="clickable play-btn" onClick={() => this.play()}>
        <div class="play-btn-text">{this.state.playback.playing ? '| |' : '▶'}</div>
      </div>
      <div class="transcription-box" style={{ flexGrow: 1 }}>
        <div class="transcription-text">
          {this.props.data.analysis.transcripts[0].tokens.map((t, i) => (
            <span class="token" ref={r => { this.tokenRefs[i] = r; }}>{t.text}</span>
          ))}
        </div>
      </div>
    </div>;
  }
}
