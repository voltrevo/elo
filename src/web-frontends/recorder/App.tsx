import * as preact from 'preact';

import { Analysis } from '../../analyze';
import never from '../../helpers/never';
import audio from './audio';
import RecorderPanel from './RecorderPanel';
import SettingsPanel from './SettingsPanel';
import TranscriptionPlayer from './TranscriptionPlayer';

export type Settings = {
  maximumGap: number,
  cursorCorrection: number,
};

export type RecordingState = (
  { name: 'init' } |
  {
    name: 'recording',
    startTime: number,
    previewDuration: number,
    recorder: audio.Recorder,
  } |
  {
    name: 'recorded',
    duration: number,
    recording: audio.Recording,
  } |
  {
    name: 'transcribed',
    transcription: Transcription,
  }
);

export type Transcription = {
  recording: audio.Recording,
  analysis: Analysis,
  transcriptionTime: number,
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
    maximumGap: 0.15,
    cursorCorrection: 0.31,
  },
  transcriptions: [],
};

export default class App extends preact.Component<{}, State> {
  state = initialState;
  targetTranscriptRef: HTMLInputElement | undefined;

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

  async onRecordToggle() {
    switch (this.state.recorder.name) {
      case 'init':
      case 'transcribed':
        const recorder = await audio.record();

        this.setState({
          recorder: {
            name: 'recording',
            startTime: Date.now(),
            previewDuration: 0,
            recorder,
          },
        });

        this.updateLoop();

        break;

      case 'recording':
        const recording = await this.state.recorder.recorder.stop();

        this.setState({
          recorder: {
            name: 'recorded',
            duration: Date.now() - this.state.recorder.startTime,
            recording,
          },
        });

        const startTranscriptionTime = Date.now();

        const headers: Record<string, string> = {};
        const targetTranscript = this.targetTranscriptRef?.value || undefined;

        if (targetTranscript !== undefined) {
          headers['x-target-transcript'] = targetTranscript;
        }

        const response = await fetch('/analyze', {
          method: 'POST',
          headers,
          body: recording.blob,
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

        break;

      case 'recorded':
        console.log('Not implemented: starting a new recording while transcription is in progress');
        break;

      default:
        never(this.state.recorder);
    }
  }

  render() {
    return <div class="recorder-app">
      <RecorderPanel
        recordingState={this.state.recorder}
        onRecordToggle={() => this.onRecordToggle()}
        onTargetTranscriptRef={r => { this.targetTranscriptRef = r; }}
      />
      <SettingsPanel
        settings={this.state.settings}
        onChange={settings => this.setState({ settings })}
      />
      {this.state.transcriptions.slice().reverse().map(data => (
        <TranscriptionPlayer
          data={data}
          cursorCorrection={this.state.settings.cursorCorrection}
          maximumGap={this.state.settings.maximumGap}
        />
      ))}
    </div>;
  }
}
