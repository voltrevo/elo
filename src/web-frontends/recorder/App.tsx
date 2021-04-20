import * as preact from 'preact';

import { Analysis } from '../../analyze';
import never from '../../helpers/never';
import audio from './audio';
import RecordButton from './RecordButton';
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
    const text: preact.JSX.Element = (() => {
      switch (this.state.recorder.name) {
        case 'init':
          return <p>⬅ Click the record button to start</p>;

        case 'recording':
          return <p>Recording... ({(this.state.recorder.previewDuration / 1000).toFixed(1)}s)</p>;

        case 'recorded':
          return <p>
            Recorded {(this.state.recorder.duration / 1000).toFixed(1)}s, transcribing...
          </p>;

        case 'transcribed':
          return <p>
            Transcribed: {
              this.state.recorder.analysis.transcripts.length === 1
                ? this.state.recorder.analysis.transcripts[0].tokens.map(t => t.text).join('')
                : <ol>{
                  this.state.recorder.analysis.transcripts.map(
                    transcript => <li>{transcript.tokens.map(t => t.text).join('')}</li>,
                  )
                }</ol>
            }
          </p>;

        default:
          never(this.state.recorder);
      }
    })();

    return <div class="recorder-app">
      <div style={{ display: 'flex', flexDirection: 'row', padding: '2em' }}>
        <RecordButton
          active={this.state.recorder.name === 'recording'}
          onClick={() => this.onRecordToggle()}
        />
        <div style={{ marginLeft: '2em' }}>{text}</div>
      </div>
      {this.state.transcriptions.reverse().map(data => <TranscriptionPlayer data={data}/>)}
    </div>;
  }
}
