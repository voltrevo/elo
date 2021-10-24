import * as preact from 'preact';

import nil from '../../helpers/nil';
import TaskQueue from '../../helpers/TaskQueue';

type State = {
  size?: { width: number, height: number };
};

export default class WaveForm extends preact.Component<{}, State> {
  container?: HTMLDivElement;
  cleanupTasks = new TaskQueue();

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
    </div>;
  }
}
