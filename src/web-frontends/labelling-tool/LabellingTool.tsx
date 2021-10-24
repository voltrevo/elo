import * as preact from 'preact';

import FileSet from './FileSet';
import Setup from './Setup';
import WaveForm from './WaveForm';

type State = {
  fileSet?: FileSet,
};

export default class LabellingTool extends preact.Component<{}, State> {
  render() {
    if (!this.state.fileSet) {
      return <Setup onFileSet={(fileSet) => this.setState({ fileSet })}/>;
    }

    return <>
      Ready
      <div style={{ height: '100px' }}>
        <WaveForm src={this.state.fileSet.analysisAudioFile}/>
      </div>
    </>;
  }
}
