import * as preact from 'preact';

import { Analysis, AnalysisFragment } from '../../analyze';
import base58 from '../../helpers/base58';
import never from '../../helpers/never';
import audio from './audio';
import RecorderPanel from './RecorderPanel';
import SettingsPanel from './SettingsPanel';
import TranscriptionPlayer from './TranscriptionPlayer';

export type Settings = {
  maximumGap: number | null,
  monospace: boolean,
  cursorCorrection: number,
  tokenDisplay: 'both' | 'target' | 'spoken',
};

export type RecordingState = (
  { name: 'init' } |
  {
    name: 'recording',
    startTime: number,
    previewDuration: number,
    recorder: audio.Recorder,
    webSocket: WebSocket,
    transcriptionIndex: number,
  } |
  {
    name: 'recorded',
    recording: audio.Recording,
  } |
  {
    name: 'transcribed',
    transcription: Transcription,
  }
);

export type Transcription = {
  recording?: audio.Recording,
  analysis: Analysis,
};

type State = {
  settings: Settings,
  recorder: RecordingState,
  transcriptions: Transcription[],
}

const initialState: State = {
  recorder: {
    name: 'init',
  },
  settings: {
    maximumGap: null,
    monospace: false,
    cursorCorrection: 0.31,
    tokenDisplay: 'both',
  },
  transcriptions: [],
};

export default class App extends preact.Component<{}, State> {
  state = initialState;
  targetTranscriptRef: HTMLTextAreaElement | undefined;

  async updateLoop() {
    await new Promise(resolve => setTimeout(resolve, 110));

    while (this.state.recorder.name === 'recording') {
      this.setState({
        recorder: {
          ...this.state.recorder,
          previewDuration: Date.now() - this.state.recorder.startTime,
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async onFile(file: File) {
    switch (this.state.recorder.name) {
      case 'init':
      case 'transcribed':
        console.error('Not implemented: Upload file (since streaming update)');
        // await this.transcribe({ type: 'audio.Recording', duration: null, data: file });
        break;

      case 'recorded':
      case 'recording':
        console.error(`Refusing to process file in state ${this.state.recorder.name}`);
        break;

      default:
        never(this.state.recorder);
    }
  }

  async onRecordToggle() {
    switch (this.state.recorder.name) {
      case 'init':
      case 'transcribed': {
        const loc = window.location;
        const wsProto = loc.protocol === 'https' ? 'wss' : 'ws';
        const portSuffix = loc.port === '' ? '' : `:${loc.port}`;
        const webSocket = new WebSocket(`${wsProto}://${loc.hostname}${portSuffix}/analyze`);

        await new Promise(resolve => {
          webSocket.addEventListener('open', resolve);
        });

        const transcriptionIndex = this.state.transcriptions.length;

        let analysis: Analysis = {
          tokens: [],
          words: [],
          duration: 0,
        };

        const setTranscription = () => {
          this.setState({
            transcriptions: [
              ...this.state.transcriptions.slice(0, transcriptionIndex),
              {
                ...this.state.transcriptions[transcriptionIndex],
                analysis,
              },
              ...this.state.transcriptions.slice(transcriptionIndex + 1),
            ],
          });
        };

        setTranscription();

        webSocket.addEventListener('message', evt => {
          const fragment: AnalysisFragment = JSON.parse(evt.data);

          switch (fragment.type) {
            case 'token': {
              analysis = {
                ...analysis,
                tokens: [...analysis.tokens, fragment.value],
                duration: fragment.value.start_time ?? analysis.duration,
              };

              break;
            }

            case 'word': {
              analysis = {
                ...analysis,
                words: [...analysis.words, fragment.value],
                duration: fragment.value.start_time ?? analysis.duration,
              };

              break;
            }

            case 'error': {
              console.error('Transcription error', fragment.value.message);

              break;
            }

            case 'end': {
              analysis = {
                ...analysis,
                duration: fragment.value.duration,
              };

              console.log({ analysis });

              break;
            }

            default: {
              never(fragment);
            }
          }

          setTranscription();
        });

        const recorder = await audio.record(blob => {
          webSocket.send(blob);
        });

        this.setState({
          recorder: {
            name: 'recording',
            startTime: Date.now(),
            previewDuration: 0,
            recorder,
            webSocket,
            transcriptionIndex,
          },
        });

        this.updateLoop();

        break;
      }

      case 'recording': {
        const recording = await this.state.recorder.recorder.stop();

        this.setState({
          recorder: {
            name: 'recorded',
            recording,
          },
        });

        const webSocket = this.state.recorder.webSocket;

        webSocket.send(Uint8Array.from([]));

        this.setState({
          recorder: {
            name: 'transcribed',
            transcription: this.state.transcriptions[this.state.recorder.transcriptionIndex],
          },
        });

        break;
      }

      case 'recorded': {
        console.log('Not implemented: starting a new recording while transcription is in progress');
        break;
      }

      default: {
        never(this.state.recorder);
      }
    }
  }

  async transcribe(recording: audio.Recording) {
    this.setState({
      recorder: {
        name: 'recorded',
        recording,
      },
    });

    const startTranscriptionTime = Date.now();

    const headers: Record<string, string> = {};
    const targetTranscript = this.targetTranscriptRef?.value || undefined;

    if (targetTranscript !== undefined) {
      headers['x-target-transcript'] = base58.encode(
        new TextEncoder().encode(targetTranscript),
      );
    }

    const response = await fetch('/analyze', {
      method: 'POST',
      headers,
      body: recording instanceof File ? recording : recording.data,
    });

    const analysis: Analysis = await response.json();

    console.log({ analysis });

    const transcription = {
      recording,
      analysis,
      transcriptionTime: Date.now() - startTranscriptionTime,
    };

    this.setState({
      recorder: {
        name: 'transcribed',
        transcription,
      },
      transcriptions: [
        ...this.state.transcriptions,
        transcription,
      ],
    });
  }

  render() {
    return <div class="recorder-app">
      <RecorderPanel
        recordingState={this.state.recorder}
        onRecordToggle={() => this.onRecordToggle()}
        onTargetTranscriptRef={r => { this.targetTranscriptRef = r; }}
        onFile={file => this.onFile(file)}
      />
      <SettingsPanel
        settings={this.state.settings}
        onChange={settings => this.setState({ settings })}
      />
      {this.state.transcriptions.slice().reverse().map(data => (
        <TranscriptionPlayer
          data={data}
          settings={this.state.settings}
          onDelete={() => {
            this.setState({
              transcriptions: this.state.transcriptions.filter(tr => tr !== data),
            });
          }}
        />
      ))}
    </div>;
  }
}
