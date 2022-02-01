import * as React from 'react';

import nil from '../../helpers/nil';
import TaskQueue from '../../helpers/TaskQueue';
import Label from './Label';

type Props = {
  label: Label; // TODO: Unused
  left: string;
  move: (clientX: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
};

export default class LabelComponent extends React.Component<Props> {
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

    if (this.props.label.type === 'reference') {
      this.ref.addEventListener('mousedown', this.dragStart);
    }
  };

  dragStart = (evt: MouseEvent) => {
    if (this.ref === nil) {
      return;
    }

    this.props.onDragStart();

    const self = this;

    function onMouseMove(moveEvt: MouseEvent) {
      self.props.move(moveEvt.clientX);
    }

    onMouseMove(evt);

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setTimeout(self.props.onDragEnd);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  render() {
    const classes = ['label', this.props.label.type];

    return <div
      className={classes.join(' ')}
      ref={this.setRef}
      style={{ left: this.props.left }}
    >
      <div className="circle">
        {(() => {
          const text = looseProp(this.props.label.data, 'text');

          if (typeof text !== 'string') {
            return <></>;
          }

          return <div className="text">{text}</div>;
        })()}
      </div>
    </div>;
  }
}

function looseProp(obj: unknown, key: string): unknown {
  if (obj === null || obj === nil) {
    return nil;
  }

  return (obj as Record<string, unknown>)[key];
}
