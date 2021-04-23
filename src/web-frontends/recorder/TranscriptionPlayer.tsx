import * as preact from 'preact';

import type { Analysis, AnalysisToken } from '../../analyze';
import never from '../../helpers/never';
import { Settings } from './App';
import audio from './audio';

type Props = {
  data: {
    recording: audio.Recording,
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

type Segment = {
  type: 'correct' | 'spoken-incorrect' | 'missed' | 'combined',
  raisedTokens: ExpandedToken[],
  tokens: ExpandedToken[],
};

type Word = {
  tokens: ExpandedToken[],
  target: string,
  spoken: string,
  segments: Segment[],
}

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
      const url = URL.createObjectURL(this.props.data.recording.data);
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
    if (this.props.data.analysis.target) {
      return this.props.data.analysis.target.tokens;
    }

    return this.props.data.analysis.deepspeech.transcripts[0].tokens;
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
      if (token.start_time === undefined) {
        expandedTokens.push(token);
      } else {
        let gap = token.start_time - (prevToken?.start_time ?? 0);

        while (gap > this.props.settings.maximumGap) {
          expandedTokens.push(null);
          gap -= this.props.settings.maximumGap;
        }

        expandedTokens.push(token);
        prevToken = { ...token, start_time: token.start_time };
      }
    }

    const lastToken = prevToken;

    if (lastToken) {
      let gap = this.props.data.analysis.duration - lastToken.start_time;

      while (gap > this.props.settings.maximumGap) {
        expandedTokens.push(null);
        gap -= this.props.settings.maximumGap;
      }
    }

    return expandedTokens;
  }

  static assembleWords(expandedTokens: ExpandedToken[]): Word[] {
    const flatWords: ExpandedToken[][] = [];
    let currentWord: ExpandedToken[] = [];

    for (const token of expandedTokens) {
      if (token?.text === ' ' && token.type !== 'spoken-incorrect') {
        if (currentWord.length !== 0) {
          flatWords.push(currentWord);
          currentWord = [];
        }
      } else {
        currentWord.push(token);
      }
    }

    if (currentWord.length !== 0) {
      flatWords.push(currentWord);
      currentWord = [];
    }

    const words: Word[] = [];

    for (const flatWord of flatWords) {
      const segments: Segment[] = [];

      let partialSegment: Omit<Segment, 'type'> & { type?: Segment['type'] } = {
        raisedTokens: [],
        tokens: [],
      };

      function addSegment(type: Segment['type']) {
        segments.push({
          ...partialSegment,
          type,
        });

        partialSegment = {
          raisedTokens: [],
          tokens: [],
        };
      }

      for (const token of flatWord) {
        if (token === null) {
          partialSegment.raisedTokens.push(null);
          partialSegment.tokens.push(null);
        } else {
          if (partialSegment.type !== token.type && token.type !== undefined) {
            if (partialSegment.type === undefined) {
              partialSegment.type = token.type;
            } else if (token.type === 'correct') {
              addSegment(partialSegment.type);
              partialSegment.type = token.type;
            } else if (token.type === 'missed') {
              if (partialSegment.type === 'spoken-incorrect') {
                partialSegment.type = 'combined';
              } else if (partialSegment.type !== 'combined') {
                addSegment(partialSegment.type);
                partialSegment.type = token.type;
              }
            } else if (token.type === 'spoken-incorrect') {
              if (partialSegment.type === 'missed') {
                partialSegment.type = 'combined';
              } else if (partialSegment.type !== 'combined') {
                addSegment(partialSegment.type);
                partialSegment.type = token.type;
              }
            } else {
              never(token.type);
            }
          }

          const positionalTokens = token.type === 'spoken-incorrect'
            ? partialSegment.raisedTokens
            : partialSegment.tokens;
          
          positionalTokens.push(token);
        }
      }

      if (partialSegment.tokens.length + partialSegment.raisedTokens.length > 0) {
        addSegment(partialSegment.type ?? 'correct');
      }

      words.push({
        tokens: flatWord,
        target: flatWord
          .filter(t => t?.type !== 'spoken-incorrect')
          .map(t => t?.text ?? '')
          .join(''),
        spoken: flatWord
          .filter(t => t?.type !== 'missed')
          .map(t => t?.text ?? '')
          .join(''),
        segments,
      });
    }

    return words;
  }

  renderSegment(tokens: AnalysisToken[], segment: Segment): preact.JSX.Element | null {
    if (
      (segment.type === 'missed' && this.props.settings.tokenDisplay === 'spoken') ||
      (segment.type === 'spoken-incorrect' && this.props.settings.tokenDisplay === 'target')
    ) {
      return null;
    }

    if (segment.type === 'correct') {
      return <div>
        {segment.tokens.map(t => t === null ? <span> </span> : <span
          class="token"
          ref={r => {
            this.tokenRefs[tokens.indexOf(t)] = r;
          }}
        >
          {t?.text ?? ' '}
        </span>)}
      </div>;
    }

    const raisedTokens = segment.raisedTokens.slice();
    const loweredTokens = segment.tokens.slice();

    for (const ts of [raisedTokens, loweredTokens]) {
      if (ts.length === 0) {
        ts.push({ text: ' ' });
      }
    }

    const raised = <div style={{ textAlign: 'center', minWidth: '1ex' }}>
      {raisedTokens.map(t => t === null ? <span> </span> : <span
        class="token spoken-incorrect"
        ref={r => {
          this.tokenRefs[tokens.indexOf(t)] = r;
        }}
      >
        {t?.text ?? ' '}
      </span>)}
    </div>;

    const regular = <div style={{ textAlign: 'center', minWidth: '1ex' }}>
      {loweredTokens.filter(t => t !== null).map(t => <span class="missed">{t?.text ?? ' '}</span>)}
    </div>;

    return <div style={{ display: 'flex', flexDirection: 'column' }}>
      {(this.props.settings.tokenDisplay !== 'target' && raised) ?? null}
      {(this.props.settings.tokenDisplay !== 'spoken' && regular) ?? null}
    </div>;
  }

  renderWords(): preact.JSX.Element {
    const tokens = this.getTokens();
    const words = TranscriptionPlayer.assembleWords(this.getExpandedTokens());
    (window as any).words = words;

    return <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      {words.map((word, i) => {
        const space = i !== words.length - 1 ? <span> </span> : null;
        let onRef: ((r: HTMLDivElement | null) => void) | undefined = undefined;
        const classes: string[] = [];

        if (i === 0) {
          onRef = r => { this.cursorStartRef = r };
          classes.push('text-start');
        } else if (i === words.length - 1) {
          onRef = r => { this.cursorEndRef = r };
          classes.push('text-end');
        }

        return <div
          class={classes.join(' ')}
          ref={onRef}
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
        >
          {word.segments.map(segment => this.renderSegment(tokens, segment))}
          {space}
        </div>;
      })}
    </div>;
  }

  renderTokens(): preact.JSX.Element {
    const tokens = this.getTokens();
    const expandedTokens = this.getExpandedTokens();

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
        if (
          token.type === 'spoken-incorrect' &&
          this.props.settings.tokenDisplay === 'target'
        ) {
          return null;
        }

        if (
          token.type === 'missed' &&
          this.props.settings.tokenDisplay === 'spoken'
        ) {
          return null;
        }

        if (token.type === 'spoken-incorrect' && this.props.settings.tokenDisplay === 'both') {
          classes.push('raise');
        }

        classes.push(token.type);
      }

      if (token !== null && token.start_time !== undefined) {
        const startTime = token.start_time;

        return <span
          class={['token', ...classes].join(' ')}
          onClick={() => {
            this.setState({
              time: startTime - this.props.settings.cursorCorrection,
            });
          }}
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

    return <>
      {expandedTokens.map((_t, i) => renderExpandedToken(i))}
    </>;
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
        <div class={textClasses.join(' ')}>{this.renderWords()}</div>
        <div
          style={{
            position: 'absolute',
            right: '0.2em',
            bottom: '0.2em',
          }}
          onClick={() => {
            const url = URL.createObjectURL(this.props.data.recording.data);
            download('recording.webm', url);
            URL.revokeObjectURL(url);
          }}
        >
          ⬇️
        </div>
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
  var element = document.createElement('a');
  element.setAttribute('href', url);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
