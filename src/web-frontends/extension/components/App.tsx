import * as preact from 'preact';

import never from '../../../helpers/never';
import Callbacks from '../Callbacks';

type Props = {
  callbacks: Callbacks,
};

type State = {
  active: boolean;
  loading: boolean;
  highlightWord?: string;
  word?: string;
  highlightClearTimerId?: number;
  left?: string;
  top?: string;
};

export default class App extends preact.Component<Props, State> {
  dragData: null | {
    mouseDownPos: { x: number, y: number },
    appPosAtMouseDown: { x: number, y: number },
  } = null;

  appRef: HTMLDivElement | null = null;
  headRef: HTMLDivElement | null = null;

  constructor() {
    super();

    const initialState: State = {
      active: false,
      loading: false,
    };

    this.setState(initialState);
  }

  componentWillMount() {
    this.props.callbacks.onMessage = (msg) => {
      console.debug('fluency message', msg);

      switch (msg.type) {
        case 'getUserMedia-called': {
          setTimeout(() => {
            this.setState({
              active: true,
            });
          });

          break;
        }

        case 'word': {
          if (msg.value.disfluent) {
            clearTimeout(this.state.highlightClearTimerId);

            this.setState({
              highlightWord: msg.value.text,
              highlightClearTimerId: window.setTimeout(() => {
                this.setState({ highlightWord: undefined });
              }, 3000),
              word: undefined,
            });
          } else {
            this.setState({
              word: msg.value.text,
            });
          }

          break;
        }

        case 'connecting':
        case 'reconnecting': {
          this.setState({
            loading: true,
          });

          break;
        }

        case 'connected': {
          this.setState({
            loading: false,
          });

          break;
        }

        default: {
          never(msg);
        }
      }
    };
  }

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
      class={this.state.active ? 'app active' : 'app'}
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
      <div class={this.state.highlightWord !== undefined ? 'body highlight' : 'body'}>
        {(() => {
          if (this.state.loading) {
            return <div class="meta">{'<loading>'}</div>;
          }

          return <div class="word">
            {this.state.highlightWord ?? null}
          </div>;
        })()}
      </div>
    </div>;
  }
}
