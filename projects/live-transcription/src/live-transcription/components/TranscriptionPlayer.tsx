import * as React from 'react';
import { Analysis, AnalysisToken } from '../../elo-types/Analysis';

import { download } from '../helpers/download';
import { Settings } from './App';
import audio from './audio';

/* eslint-disable camelcase */

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

type ExpandedToken = (AnalysisToken & { disfluent: boolean }) | null;

export default class TranscriptionPlayer extends React.Component<Props, State> {
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
    type PrevToken = (AnalysisToken & { start_time: number }) | null;
    let prevToken: PrevToken = null;

    let firstWord = true;

    const addChunk = (chunk: AnalysisToken[], disfluent: boolean) => {
      for (const token of chunk) {
        if (typeof token.start_time !== 'number') {
          expandedTokens.push({ ...token, disfluent });
        } else {
          let gap = token.start_time - (prevToken?.start_time ?? 0);

          if (this.props.settings.maximumGap !== null) {
            while (gap > this.props.settings.maximumGap) {
              expandedTokens.push(null);
              gap -= this.props.settings.maximumGap;
            }
          }

          expandedTokens.push({ ...token, disfluent });
          prevToken = { ...token, start_time: token.start_time };
        }
      }
    };

    for (const word of this.props.data.analysis.words) {
      if (!firstWord) {
        expandedTokens.push(null);
      } else {
        firstWord = false;
      }

      const { start_time, end_time } = word;

      if (start_time === null || end_time === null) {
        console.error('Missing start/end time');
        continue;
      }

      let wordTokens = tokens.filter(t => (
        t.start_time !== null &&
        t.start_time >= start_time &&
        t.start_time <= end_time
      ));

      if (wordTokens.map(t => t.text).join('').trim() === '') {
        let wordPlainText = word.text[0] === '<'
          ? word.text.slice(1, word.text.length - 1)
          : word.text;

        if (wordPlainText === '') {
          wordPlainText = '?';
        }

        wordTokens = Array.from(wordPlainText).map(c => ({
          start_time: word.start_time,
          text: c,
        }));
      }

      if (word.disfluent) {
        wordTokens = [
          { start_time: word.start_time, text: '<' },
          ...wordTokens,
          { start_time: word.end_time, text: '>' },
        ];
      }

      addChunk(wordTokens, word.disfluent);
    }

    const lastWord = this.props.data.analysis.words.slice(-1)[0];
    const lastWordEndTime = lastWord?.end_time ?? -Infinity;

    const trailingTokens = tokens.filter(t => t.start_time && t.start_time > lastWordEndTime);
    addChunk(trailingTokens, false);

    const lastToken = prevToken as PrevToken;

    if (this.props.settings.maximumGap !== null && lastToken) {
      let gap = this.props.data.analysis.duration - lastToken.start_time;

      while (gap > this.props.settings.maximumGap) {
        expandedTokens.push(null);
        gap -= this.props.settings.maximumGap;
      }
    }

    return expandedTokens;
  }

  renderTranscript(): React.ReactNode {
    const tokens = this.getTokens();
    const expandedTokens = this.getExpandedTokens();

    return <div>
      {expandedTokens.map(t => {
        if (t === null) {
          return <span> </span>;
        }

        const startTime = t.start_time;

        return <span
          className={!t.disfluent ? 'token' : 'token spoken-incorrect'}
          ref={r => {
            this.tokenRefs[tokens.findIndex(tr => tr.start_time === startTime)] = r;
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
      {this.props.data.analysis.complete ? null : <div className="spinner">
        <div className="spinner-content"></div>
      </div>}
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

    const panel = <div className="transcription-player panel">
      <div className="play-btn" onClick={() => this.playPause()}>
        <div className="play-btn-text">{this.state.playing ? '| |' : '▶'}</div>
      </div>
      <div className="transcription-box">
        <div className={textClasses.join(' ')}>{this.renderTranscript()}</div>
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
        className="transcription-cursor"
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
