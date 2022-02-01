import * as React from 'react';

import { Analysis, AnalysisFragment } from '../../analyze';
import never from '../../helpers/never';
import clientConfig from '../helpers/clientConfig';
import AnalysisBuilder from './AnalysisBuilder';
import audio from './audio';
import RecorderPanel from './RecorderPanel';
import SettingsPanel from './SettingsPanel';
import TranscriptionPlayer from './TranscriptionPlayer';

export type Settings = {
  maximumGap: number | null,
  monospace: boolean,
  cursorCorrection: number,
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
    duration: number,
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
  },
  transcriptions: [],
};

export default class App extends React.Component<{}, State> {
  state = initialState;

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
        // console.error('Not implemented: Upload file (since streaming update)');
        await this.transcribe({ type: 'audio.Recording', duration: null, data: file });
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
        const wsProto = clientConfig.tls ? 'wss:' : 'ws:';
        const webSocket = new WebSocket(`${wsProto}//${clientConfig.hostAndPort}/analyze`);

        await new Promise(resolve => {
          webSocket.addEventListener('open', resolve);
        });

        const transcriptionIndex = this.state.transcriptions.length;

        const analysisBuilder = new AnalysisBuilder();

        const setTranscription = () => {
          this.setState({
            transcriptions: [
              ...this.state.transcriptions.slice(0, transcriptionIndex),
              {
                ...this.state.transcriptions[transcriptionIndex],
                analysis: analysisBuilder.analysis,
              },
              ...this.state.transcriptions.slice(transcriptionIndex + 1),
            ],
          });
        };

        setTranscription();

        webSocket.addEventListener('message', evt => {
          const fragment: AnalysisFragment = JSON.parse(evt.data);
          analysisBuilder.add(fragment);

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

        const ti = this.state.recorder.transcriptionIndex;

        this.setState({
          recorder: {
            name: 'transcribed',
            duration: this.state.recorder.previewDuration,
          },
          transcriptions: [
            ...this.state.transcriptions.slice(0, ti),
            {
              ...this.state.transcriptions[ti],
              recording,
            },
            ...this.state.transcriptions.slice(ti + 1),
          ],
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

    const response = await fetch('/analyze', {
      method: 'POST',
      headers,
      body: recording instanceof File ? recording : recording.data,
    });

    const analysisFragments: AnalysisFragment[] = (await response.text())
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => JSON.parse(line));

    const analysisBuilder = new AnalysisBuilder();

    for (const fragment of analysisFragments) {
      analysisBuilder.add(fragment);
    }

    const transcription = {
      recording,
      analysis: analysisBuilder.analysis,
      transcriptionTime: Date.now() - startTranscriptionTime,
    };

    this.setState({
      recorder: {
        name: 'transcribed',
        duration: transcription.analysis.duration,
      },
      transcriptions: [
        ...this.state.transcriptions,
        transcription,
      ],
    });
  }

  render() {
    return <div className="recorder-app">
      <RecorderPanel
        recordingState={this.state.recorder}
        onRecordToggle={() => this.onRecordToggle()}
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
