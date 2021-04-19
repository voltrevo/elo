import * as preact from 'preact';

import { Analysis } from '../../analyze';
import audio from './audio';

type Props = {
  data: {
    recording: audio.Recording,
    analysis: Analysis,
  },
};

export default class TranscriptionPlayer extends preact.Component<Props> {
  render() {
    return <div class="transcription-player" style={{ display: 'flex', flexDirection: 'row' }}>
      <div class="clickable play-btn" onClick={() => audio.play(this.props.data.recording)}>
        <div class="play-btn-text">▶</div>
      </div>
      <div class="transcription-box">
        <div class="transcription-text">
          {this.props.data.analysis.transcripts[0].tokens.map(t => t.text).join('')}
        </div>
      </div>
    </div>;
  }
}
