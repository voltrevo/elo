import * as React from 'react';

import nil from '../../helpers/nil';
import TaskQueue from '../../helpers/TaskQueue';

type Props = {
  data: Float32Array,
  start: number;
  end: number;
};

type State = {
  size?: { width: number, height: number };
};

const yPosSamples = 50;

export default class WaveForm extends React.Component<Props, State> {
  container?: HTMLDivElement;
  cleanupTasks = new TaskQueue();
  canvas?: HTMLCanvasElement;
  canvasRenderPending = false;
  canvasRenderQueued = false;
  lastRenderTime = 0;
  nextRenderMinTime = 0;
  renderTimer?: number;

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
      this.canvasRenderPending &&
      !this.canvasRenderQueued
    )) {
      return;
    }

    const timeUntilRender = this.nextRenderMinTime - Date.now();

    clearTimeout(this.renderTimer);

    this.canvasRenderQueued = true;

    this.renderTimer = window.setTimeout(() => {
      const renderStart = Date.now();
      this.renderCanvas();
      this.renderTimer = nil;
      this.lastRenderTime = Date.now();
      const renderDuration = Date.now() - renderStart;
      this.nextRenderMinTime = this.lastRenderTime + 9 * renderDuration;
    }, Math.max(timeUntilRender, 0));
  }

  renderCanvas() {
    const size = this.state.size;

    const ctx = this.canvas?.getContext('2d');

    if (!this.canvas || !ctx || !size) {
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

    const { data, start, end } = this.props;

    function yPos(a: number, b: number) {
      let maxY = 0;

      if (b - a <= yPosSamples) {
        for (let i = a; i < b; i++) {
          const y = data[i];

          if (Math.abs(y) > Math.abs(maxY)) {
            maxY = y;
          }
        }
      } else {
        for (let i = 0; i < 20; i++) {
          const y = data[Math.round(a + i / 20 * (b - a))];

          if (Math.abs(y) > Math.abs(maxY)) {
            maxY = y;
          }
        }
      }

      return height * (-maxY + 1) / 2;
    }

    ctx.moveTo(0, yPos(0, 1));

    for (let x = 1; x < width; x++) {
      const a = Math.round(start + ((x - 1) / width) * (end - start));
      const b = Math.round(start + (x / width) * (end - start));
      ctx.lineTo(x, yPos(a, b));
    }

    ctx.stroke();

    this.canvasRenderPending = false;
    this.canvasRenderQueued = false;
  }
}
