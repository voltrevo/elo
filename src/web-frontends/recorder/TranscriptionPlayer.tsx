import * as preact from 'preact';

import { Analysis } from '../../analyze';
import audio from './audio';

type Props = {
  data: {
    recording: audio.Recording,
    analysis: Analysis,
  },
};

type State = {
  playing: boolean,
};

export default class TranscriptionPlayer extends preact.Component<Props, State> {
  state = {
    playing: false,
  };

  async play() {
    if (this.state.playing) {
      return;
    }

    this.setState({
      playing: true,
    });

    await audio.play(this.props.data.recording);

    this.setState({
      playing: false,
    });
  }

  render() {
    return <div class="transcription-player" style={{ display: 'flex', flexDirection: 'row' }}>
      <div class="clickable play-btn" onClick={() => this.play()}>
        <div class="play-btn-text">{this.state.playing ? '| |' : '▶'}</div>
      </div>
      <div class="transcription-box" style={{ flexGrow: 1 }}>
        <div class="transcription-text">
          {this.props.data.analysis.transcripts[0].tokens.map(t => t.text).join('')}
        </div>
      </div>
    </div>;
  }
}
