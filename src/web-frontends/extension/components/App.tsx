import * as preact from 'preact';

import never from '../../../helpers/never';
import Callbacks from '../Callbacks';

type Props = {
  callbacks: Callbacks,
};

type WordBox = {
  word: string;
  count: number;
  highlight: boolean;
  highlightTimerId?: number;
};

type State = {
  active: boolean;
  loading: boolean;
  word?: string;
  left?: string;
  top?: string;

  fillerBox: WordBox;
  otherDisfluentBox: WordBox;
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
      fillerBox: {
        word: '',
        count: 0,
        highlight: false,
      },
      otherDisfluentBox: {
        word: '',
        count: 0,
        highlight: false,
      },
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
          const key = msg.value.category === 'filler'
            ? 'fillerBox' as const
            : 'otherDisfluentBox' as const;

          clearTimeout(this.state[key].highlightTimerId);

          this.setState({
            [key]: {
              word: msg.value.text,
              count: this.state[key].count + 1,
              highlight: true,
              highlightTimerId: window.setTimeout(() => {
                this.setState({
                  [key]: {
                    ...this.state[key],
                    highlight: false,
                  },
                });
              }, 3000),
            },
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
          <div class="word-box-container spacer">
            <div
              class={[
                'common-centering',
                'word-box',
                ...(this.state.fillerBox.highlight ? ['highlight'] : []),
              ].join(' ')}
            >
              {this.state.fillerBox.word}
            </div>
          </div>
          <div class="common-centering counter">
            {this.state.fillerBox.count}
          </div>
        </div>
        <div class="center common-centering">
          <div class="content common-centering">
            {this.state.loading ? <div class="spinner"></div> : 'elo'}
          </div>
        </div>
        <div class="right spacer">
          <div class="common-centering counter">
            {this.state.otherDisfluentBox.count}
          </div>
          <div class="word-box-container spacer">
            <div
              class={[
                'common-centering',
                'word-box',
                ...(this.state.otherDisfluentBox.highlight ? ['highlight'] : []),
              ].join(' ')}
            >
              {this.state.otherDisfluentBox.word}
            </div>
          </div>
        </div>
      </div>
    </div>;
  }
}
