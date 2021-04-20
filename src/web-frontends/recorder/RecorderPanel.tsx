import * as preact from 'preact';

import type { Analysis } from '../../analyze';
import never from '../../helpers/never';
import audio from './audio';

import RecordButton from './RecordButton';

type Props = {
  recordingState: (
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
  onRecordToggle: () => void,
};

export default class RecorderPanel extends preact.Component<Props> {
  renderText() {
    const recordingState = this.props.recordingState;

    switch (recordingState.name) {
      case 'init':
        return <p>⬅ Click the record button to start</p>;

      case 'recording':
        return <p>Recording... ({(recordingState.previewDuration / 1000).toFixed(1)}s)</p>;

      case 'recorded':
        return <p>
          Recorded {(recordingState.duration / 1000).toFixed(1)}s, transcribing...
        </p>;

      case 'transcribed':
        return <p>
          Transcribed: {
            recordingState.analysis.transcripts.length === 1
              ? recordingState.analysis.transcripts[0].tokens.map(t => t.text).join('')
              : <ol>{
                recordingState.analysis.transcripts.map(
                  transcript => <li>{transcript.tokens.map(t => t.text).join('')}</li>,
                )
              }</ol>
          }
        </p>;

      default:
        never(recordingState);
    }
  }

  render() {
    return <div style={{ display: 'flex', flexDirection: 'row', padding: '2em' }}>
      <RecordButton
        active={this.props.recordingState.name === 'recording'}
        onClick={this.props.onRecordToggle}
      />
      <div style={{ marginLeft: '2em' }}>{this.renderText()}</div>
    </div>;
  }
}
