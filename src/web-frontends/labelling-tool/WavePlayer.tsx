import * as preact from 'preact';

import FileSet from './FileSet';
import nil from '../../helpers/nil';
import WaveForm from './WaveForm';
import WaveOverlay from './WaveOverlay';
import audioContext from './audioContext';

type Props = {
  fileSet: FileSet;
};

type State = {
  currentTime: number;
  audioData?: Float32Array;
  totalTime?: number;
};

export default class WavePlayer extends preact.Component<Props, State> {
  analysisAudioElement?: HTMLAudioElement;
  otherAudioElement?: HTMLAudioElement;
  analysisAudioUrl?: string;
  otherAudioUrl?: string;

  constructor(props: Props) {
    super(props);

    this.state = {
      currentTime: 0,
    };
  }

  async componentWillMount() {
    this.analysisAudioUrl = URL.createObjectURL(this.props.fileSet.analysisAudioFile);
    const analysisAudioElement = new Audio(this.analysisAudioUrl);
    this.analysisAudioElement = analysisAudioElement;

    analysisAudioElement.ontimeupdate = () => {
      this.setState({
        currentTime: analysisAudioElement.currentTime,
      });
    };

    if (this.props.fileSet.otherAudioFile !== null) {
      this.otherAudioUrl = URL.createObjectURL(this.props.fileSet.otherAudioFile);
      this.otherAudioElement = new Audio(this.otherAudioUrl);
    }

    const audioBuffer = await audioContext.decodeAudioData(
      await this.props.fileSet.analysisAudioFile.arrayBuffer(),
    );

    this.setState({
      totalTime: audioBuffer.duration,
      audioData: audioBuffer.getChannelData(0), // TODO: Mix channels
    });
  }

  componentWillUnmount() {
    this.analysisAudioElement?.pause();
    this.otherAudioElement?.pause();

    if (this.analysisAudioUrl) {
      URL.revokeObjectURL(this.analysisAudioUrl);
    }

    if (this.otherAudioUrl !== nil) {
      URL.revokeObjectURL(this.otherAudioUrl);
    }
  }

  play = () => {
    this.analysisAudioElement?.play();
    this.otherAudioElement?.play();
  };

  pause = () => {
    this.analysisAudioElement?.pause();
    this.otherAudioElement?.pause();
  };

  render() {
    return <div class="wave-player">
      <div style={{ height: '300px', position: 'relative' }}>
        <div style={{ height: '33%' }}>
          {(() => {
            if (!this.state.audioData) {
              return <>Loading</>;
            }

            return <WaveForm
              data={this.state.audioData}
              start={0}
              end={this.state.audioData.length}
            />;
          })()}
        </div>
        <div style={{
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          position: 'absolute',
        }}>
          <WaveOverlay currentTime={this.state.currentTime} totalTime={this.state.totalTime}/>
        </div>
      </div>
      <button onClick={this.play}>
        Play
      </button>
      <button onClick={this.pause}>
        Pause
      </button>
    </div>;
  }
}
