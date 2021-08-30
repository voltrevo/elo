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
  dragRef: HTMLDivElement | null = null;

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
          this.setState({ word: msg.value.text });
          break;
        }

        case 'disfluent': {
          clearTimeout(this.state.highlightClearTimerId);

          this.setState({
            highlightWord: msg.value.text,
            highlightClearTimerId: window.setTimeout(() => {
              this.setState({ highlightWord: undefined });
            }, 3000),
            word: undefined,
          });

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
    if (this.appRef === null || this.dragRef === null) {
      return;
    }

    this.dragRef.addEventListener('mousedown', (evt) => {
      if (this.dragData !== null || this.appRef === null || this.dragRef === null) {
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
        this.dragRef = r;
        this.trySetupDragging();
      }}
      style={{
        left: this.state.left ?? '',
        top: this.state.top ?? '',
      }}
    >
      <div class="body">
        <div class="left spacer">
          <div class="spacer common-centering"></div>
          <div class="word-box-container">
            <div class="common-centering word-box">
              Uhm
            </div>
          </div>
          <div class="common-centering counter">25</div>
        </div>
        <div class="center common-centering">
          <div class="content common-centering">
            {this.state.loading ? <div class="spinner"></div> : null}
          </div>
        </div>
        <div class="right spacer">
          <div class="common-centering counter">11</div>
          <div class="word-box-container">
            <div class="common-centering word-box">
              Literally
            </div>
          </div>
          <div class="spacer common-centering"></div>
        </div>
      </div>
    </div>;
  }
}
