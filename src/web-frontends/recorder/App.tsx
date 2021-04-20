import * as preact from 'preact';

import { Analysis } from '../../analyze';
import never from '../../helpers/never';
import audio from './audio';
import RecorderPanel from './RecorderPanel';
import TranscriptionPlayer from './TranscriptionPlayer';

type State = {
  recorder: (
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
      analysis: Analysis,
    }
  ),
  transcriptions: {
    recording: audio.Recording,
    analysis: Analysis,
  }[],
}

const initialState: State = {
  recorder: {
    name: 'init',
  },
  transcriptions: [],
};

export default class App extends preact.Component<{}, State> {
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

        const response = await fetch('/analyze', {
          method: 'POST',
          body: recording.blob,
        });

        const analysis: Analysis = await response.json();

        this.setState({
          recorder: {
            name: 'transcribed',
            analysis,
          },
          transcriptions: [
            ...this.state.transcriptions,
            {
              recording,
              analysis,
            },
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
      />
      {this.state.transcriptions.slice().reverse().map(data => <TranscriptionPlayer data={data}/>)}
    </div>;
  }
}
