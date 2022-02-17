import * as React from 'react';

import type { RecordingState } from './App';
import never from '../../link-src/common-pure/never';
import RecordButton from './RecordButton';

type Props = {
  recordingState: RecordingState,
  onRecordToggle: () => void,
  onFile: (file: File) => void,
};

export default class RecorderPanel extends React.Component<Props> {
  renderText() {
    const recordingState = this.props.recordingState;

    switch (recordingState.name) {
      case 'init':
        return <p>⬅ Click the record button to start</p>;

      case 'recording':
        return <p>Recording... ({(recordingState.previewDuration / 1000).toFixed(1)}s)</p>;

      case 'recorded':
        return <p>
          Recorded {((recordingState.recording.duration ?? 0) / 1000).toFixed(1)}s, transcribing...
        </p>;

      case 'transcribed':
        return <p>
          Transcribed&nbsp;
          {((recordingState.duration ?? 0) / 1000).toFixed(1)}s
          of audio
        </p>;

      default:
        never(recordingState);
    }
  }

  render() {
    return <div className="recorder panel">
      <RecordButton
        active={this.props.recordingState.name === 'recording'}
        onClick={this.props.onRecordToggle}
        onFile={this.props.onFile}
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div>{this.renderText()}</div>
      </div>
    </div>;
  }
}
