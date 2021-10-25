import * as preact from 'preact';

import nil from '../../helpers/nil';
import TaskQueue from '../../helpers/TaskQueue';
import Label from './Label';

type Props = {
  label: Label; // TODO: Unused
  left: string;
  move: (clientX: number) => void;
};

export default class LabelComponent extends preact.Component<Props> {
  cleanupTasks = new TaskQueue();
  ref?: HTMLDivElement;

  setRef = (r: HTMLDivElement | null | nil) => {
    r = r ?? nil;

    if (this.ref === r) {
      return;
    }

    if (this.ref !== nil) {
      this.cleanupTasks.run();
    }

    this.ref = r;

    if (this.ref === nil) {
      return;
    }

    this.ref.addEventListener('mousedown', this.dragStart);
  };

  dragStart = (evt: MouseEvent) => {
    if (this.ref === nil) {
      return;
    }

    const rect = this.ref.getBoundingClientRect();
    const refX = rect.left + 0.5 * rect.width;

    const offsetX = refX - evt.clientX;

    const self = this;

    function onMouseMove(moveEvt: MouseEvent) {
      self.props.move(moveEvt.clientX + offsetX);
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  render() {
    return <div
      class="label"
      ref={this.setRef}
      style={{ left: this.props.left }}
    />;
  }
}
