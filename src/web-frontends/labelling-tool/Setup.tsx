import * as preact from 'preact';

import DropDetector from './DropDetector';
import FileSet from './FileSet';

type Props = {
  onFileSet: (fileSet: FileSet) => void;
};

type State = Partial<FileSet>;

export default class Setup extends preact.Component<Props, State> {
  render() {
    const { analysisAudioFile, otherAudioFile, labelsFile } = this.state;

    if (!analysisAudioFile) {
      return this.renderFileRequest(
        'analysis audio',
        f => this.setState({ analysisAudioFile: f }),
      );
    }

    if (otherAudioFile === undefined) {
      return <>
        {this.renderFileRequest(
          'other audio',
          f => this.setState({ otherAudioFile: f }),
        )}
        &nbsp;
        <a onClick={() => this.setState({ otherAudioFile: null })}>Or skip</a>
      </>;
    }

    if (!labelsFile) {
      return <>
        {this.renderFileRequest(
          'labels',
          f => this.props.onFileSet({ analysisAudioFile, otherAudioFile, labelsFile: f }),
        )}
        &nbsp;
        <a
          onClick={() => this.props.onFileSet({
            analysisAudioFile,
            otherAudioFile,
            labelsFile: null,
          })}
        >Or skip</a>
      </>;
    }

    return <>
      Done
    </>;
  }

  renderFileRequest(name: string, onDrop: (f: File) => void) {
    this;

    return <div class="file-request">
      <DropDetector onDrop={onDrop}/>
      Drop {name} file here
    </div>;
  }
}
