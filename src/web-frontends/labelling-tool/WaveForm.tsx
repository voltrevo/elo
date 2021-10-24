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

const minRenderDelay = 300;

export default class WaveForm extends preact.Component<Props, State> {
  container?: HTMLDivElement;
  cleanupTasks = new TaskQueue();
  canvas?: HTMLCanvasElement;
  canvasRenderPending = false;
  lastRenderTime = 0;
  renderTimer?: number;

  constructor(props: Props) {
    super(props);
  }

  async componentWillMount() {
    const audioBuffer = await audioContext.decodeAudioData(await this.props.src.arrayBuffer());

    this.setState({
      audioBuffer,
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

  setCanvas = (canvas: HTMLCanvasElement | null) => {
    this.canvas = canvas ?? nil;
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
    this.canvasRenderPending = true;
    setTimeout(() => this.tryRenderCanvas());

    return <div
      ref={this.setContainer}
      style={{
        width: '100%',
        height: '100%',
        border: '1px solid black',
      }}
    >
      {(() => {
        if (!this.state.size) {
          return <></>;
        }

        return <canvas
          ref={this.setCanvas}
          style={{
            width: '100%',
            height: '100%',
          }}
        ></canvas>;
      })()}
    </div>;
  }

  tryRenderCanvas() {
    if (!(
      this.state.size &&
      this.canvas &&
      this.state.audioBuffer &&
      this.canvasRenderPending
    )) {
      return;
    }

    const renderTime = Date.now();
    const timeUntilRender = this.lastRenderTime + minRenderDelay - renderTime;

    clearTimeout(this.renderTimer);

    this.renderTimer = window.setTimeout(() => {
      this.renderCanvas();
      this.renderTimer = nil;
      this.lastRenderTime = Date.now();
    }, Math.max(timeUntilRender, 100));
  }

  renderCanvas() {
    this.canvasRenderPending = false;

    const size = this.state.size;

    const ctx = this.canvas?.getContext('2d');

    if (!this.canvas || !ctx || !size || !this.state.audioBuffer) {
      return;
    }

    const { width, height } = size;

    if (parseFloat(this.canvas.getAttribute('width') ?? '-1') !== width) {
      this.canvas.setAttribute('width', `${width}`);
    }

    if (parseFloat(this.canvas.getAttribute('height') ?? '-1') !== height) {
      this.canvas.setAttribute('height', `${height}`);
    }

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();

    const data = this.state.audioBuffer.getChannelData(0);

    function yPos(sample: number) {
      return height * ((-sample + 1) / 2);
    }

    ctx.moveTo(0, yPos(data[0]));

    for (let x = 1; x < width; x++) {
      const i = Math.round((x / width) * data.length);
      ctx.lineTo(x, yPos(data[i]));
    }

    ctx.stroke();
  }
}
