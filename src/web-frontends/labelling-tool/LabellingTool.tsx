import * as preact from 'preact';

import FileSet from './FileSet';
import Setup from './Setup';
import WavePlayer from './WavePlayer';

type State = {
  fileSet?: FileSet,
};

export default class LabellingTool extends preact.Component<{}, State> {
  render() {
    if (!this.state.fileSet) {
      return <Setup onFileSet={(fileSet) => this.setState({ fileSet })}/>;
    }

    return <WavePlayer fileSet={this.state.fileSet}/>;
  }
}
