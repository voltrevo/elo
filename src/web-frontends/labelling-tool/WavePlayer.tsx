import * as preact from 'preact';

import FileSet from './FileSet';
import WaveForm from './WaveForm';
import WaveOverlay from './WaveOverlay';

type Props = {
  fileSet: FileSet;
};

export default class WavePlayer extends preact.Component<Props> {
  render() {
    return <div>
      <div style={{ height: '300px', position: 'relative' }}>
        <div style={{ height: '33%' }}>
          <WaveForm src={this.props.fileSet.analysisAudioFile}/>
        </div>
        <div style={{
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          position: 'absolute',
        }}>
          <WaveOverlay/>
        </div>
      </div>
      <button>Play</button><button>Pause</button>
    </div>;
  }
}
