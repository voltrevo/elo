import * as preact from 'preact';

import type { RecordingState } from './App';
import never from '../../helpers/never';
import RecordButton from './RecordButton';

type Props = {
  recordingState: RecordingState,
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
        const timeStr = `${(recordingState.transcription.transcriptionTime / 1000).toFixed(1)}s`;

        const recordingDuration = recordingState.transcription.recording.duration;
        const transcriptionTime = recordingState.transcription.transcriptionTime;
        const speedStr = `${(100 * recordingDuration / transcriptionTime).toFixed(0)}%`;

        return <p>Transcribed in {timeStr} (speed: {speedStr})</p>;

      default:
        never(recordingState);
    }
  }

  render() {
    return <div class="recorder panel">
      <RecordButton
        active={this.props.recordingState.name === 'recording'}
        onClick={this.props.onRecordToggle}
      />
      <div>{this.renderText()}</div>
    </div>;
  }
}
