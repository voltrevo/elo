import * as preact from 'preact';

import nil from '../../helpers/nil';
import TaskQueue from '../../helpers/TaskQueue';
import audioContext from './audioContext';

type Props = {
  src: File;
};

type State = {
  audioBuffer?: AudioBuffer;
  size?: { width: number, height: number };
};

export default class WaveForm extends preact.Component<Props, State> {
  container?: HTMLDivElement;
  cleanupTasks = new TaskQueue();

  constructor(props: Props) {
    super(props);
  }

  async componentWillMount() {
    this.setState({
      audioBuffer: await audioContext.decodeAudioData(await this.props.src.arrayBuffer()),
    });
  }

  componentWillUnmount() {
    this.cleanupTasks.run();
  }

  setContainer = (container: HTMLDivElement | null) => {
    this.container = container ?? nil;
    this.updateSize();

    if (this.container) {
      const resizeObserver = new ResizeObserver(this.updateSize);
      resizeObserver.observe(this.container);

      this.cleanupTasks.push(() => {
        resizeObserver.disconnect();
      });
    }
  };

  updateSize = () => {
    if (this.container) {
      const rect = this.container.getBoundingClientRect();

      this.setState({
        size: {
          width: rect.width,
          height: rect.height,
        },
      });
    } else {
      this.setState({
        size: nil,
      });
    }
  }

  render() {
    const szStr = this.state.size ? `${this.state.size.width}w x ${this.state.size.height}h` : '';

    return <div
      ref={this.setContainer}
      style={{
        width: '100%',
        height: '100%',
        border: '1px solid black',
      }}
    >
      {szStr}
      {renderAudioBufferStr(this.state.audioBuffer)}
    </div>;
  }
}

function renderAudioBufferStr(buf: AudioBuffer | nil) {
  if (buf === nil) {
    return 'loading';
  }

  return JSON.stringify({
    length: buf.length,
    sampleRate: buf.sampleRate,
    numberOfChannels: buf.numberOfChannels,
  });
}
