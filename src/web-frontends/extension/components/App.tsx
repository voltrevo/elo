import * as preact from 'preact';

type State = {
  left?: string;
  top?: string;
};

export default class App extends preact.Component<{}, State> {
  dragData: null | {
    mouseDownPos: { x: number, y: number },
    appPosAtMouseDown: { x: number, y: number },
  } = null;

  appRef: HTMLDivElement | null = null;
  headRef: HTMLDivElement | null = null;

  trySetupDragging() {
    if (this.appRef === null || this.headRef === null) {
      return;
    }

    this.headRef.addEventListener('mousedown', (evt) => {
      if (this.dragData !== null || this.appRef === null || this.headRef === null) {
        return;
      }

      const appRect = this.appRef.getBoundingClientRect();

      this.dragData = {
        mouseDownPos: { x: evt.screenX, y: evt.screenY },
        appPosAtMouseDown: { x: appRect.left, y: appRect.top },
      };

      const mouseMoveListener = (moveEvt: MouseEvent) => {
        if (this.dragData === null || this.appRef === null) {
          return;
        }

        const diffPos = {
          x: moveEvt.screenX - this.dragData.mouseDownPos.x,
          y: moveEvt.screenY - this.dragData.mouseDownPos.y,
        };

        this.setState({
          left: `${this.dragData.appPosAtMouseDown.x + diffPos.x}px`,
          top: `${this.dragData.appPosAtMouseDown.y + diffPos.y}px`,
        });
      };

      window.addEventListener('mousemove', mouseMoveListener);

      const mouseUpListener = () => {
        window.removeEventListener('mousemove', mouseMoveListener);
        window.removeEventListener('mouseup', mouseUpListener);
        this.dragData = null;
      };

      window.addEventListener('mouseup', mouseUpListener);
    });
  }

  render(): preact.ComponentChild {
    return <div
      class="app"
      ref={r => {
        this.appRef = r;
        this.trySetupDragging();
      }}
      style={{
        left: this.state.left ?? '',
        top: this.state.top ?? '',
      }}
    >
      <div
        class="head"
        ref={r => {
          this.headRef = r;
          this.trySetupDragging();
        }}
      >
        Fluency Extension
      </div>
      <div class="body">
        <div class="word">
          Test
        </div>
      </div>
    </div>;
  }
}
