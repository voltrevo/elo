import * as preact from 'preact';

import never from '../../helpers/never';
import audio from './audio';
import RecordButton from './RecordButton';

type State = {
  full: (
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
    }
  )
}

const initialState: State = {
  full: {
    name: 'init',
  },
};

export default class App extends preact.Component<{}, State> {
  state = initialState;

  async updateLoop() {
    await new Promise(resolve => setTimeout(resolve, 110));

    while (this.state.full.name === 'recording') {
      this.setState({
        full: {
          ...this.state.full,
          previewDuration: Date.now() - this.state.full.startTime,
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async onRecordToggle() {
    switch (this.state.full.name) {
      case 'init':
        const recorder = await audio.record();

        this.setState({
          full: {
            name: 'recording',
            startTime: Date.now(),
            previewDuration: 0,
            recorder,
          },
        });

        this.updateLoop();

        break;

      case 'recording':
        const recording = await this.state.full.recorder.stop();

        this.setState({
          full: {
            name: 'recorded',
            duration: Date.now() - this.state.full.startTime,
            recording,
          },
        });

        const response = await fetch('/analyze', {
          method: 'POST',
          body: recording.blob,
        });

        const responseJson = await response.json();
        console.log(responseJson);

        break;

      case 'recorded':
        console.log('Refusing to make another recording');
        break;

      default:
        never(this.state.full);
    }
  }

  render() {
    const text: string = (() => {
      switch (this.state.full.name) {
        case 'init':
          return '⬅ Click the record button to start';

        case 'recording':
          return `Recording... (${(this.state.full.previewDuration / 1000).toFixed(1)}s)`;

        case 'recorded':
          return `Recorded ${(this.state.full.duration / 1000).toFixed(1)}s`;

        default:
          never(this.state.full);
      }
    })();

    return <div class="recorder-app">
      <div style={{ display: 'flex', flexDirection: 'row', padding: '2em' }}>
        <RecordButton
          active={this.state.full.name === 'recording'}
          onClick={() => this.onRecordToggle()}
        />
        <div style={{ marginLeft: '2em' }}>{text}</div>
      </div>
    </div>;
  }
}
