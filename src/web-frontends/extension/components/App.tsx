import * as preact from 'preact';

import never from '../../../helpers/never';
import Callbacks from '../Callbacks';
import TaskQueue from '../../../helpers/TaskQueue';

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

const disfluentRewriteMap: Record<string, string | undefined> = {
  '<?>': 'uhm',
  '<pause>': 'ehm',
};

export default class App extends preact.Component<Props, State> {
  dragData: null | {
    mouseDownPos: { x: number, y: number },
    appPosAtMouseDown: { x: number, y: number },
  } = null;

  appRef: HTMLDivElement | null = null;
  dragRef: HTMLDivElement | null = null;

  windowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  cleanupTasks = new TaskQueue();

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
              word: disfluentRewriteMap[msg.value.text] ?? msg.value.text,
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

    const onResize = () => {
      const lastWindowSize = this.windowSize;

      this.windowSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      if (this.dragData !== null || this.appRef === null) {
        return;
      }

      const left = this.appRef.style.left;
      const top = this.appRef.style.top;

      if (!left.endsWith('px') || !top.endsWith('px')) {
        return;
      }

      const padding = 18;

      const elementRect = this.appRef.getBoundingClientRect();

      const lastPosRect = {
        width: lastWindowSize.width - 2 * padding - elementRect.width,
        height: lastWindowSize.height - 2 * padding - elementRect.height,
      };

      const posRect = {
        width: this.windowSize.width - 2 * padding - elementRect.width,
        height: this.windowSize.height - 2 * padding - elementRect.height,
      };

      const oldLeft = parseFloat(left) - padding;
      const oldTop = parseFloat(top) - padding;

      if (oldLeft < 0) {
        // Do nothing
      } else if (oldLeft > lastPosRect.width) {
        this.appRef.style.left = `${padding + oldLeft - lastPosRect.width + posRect.width}`;
      } else {
        const xRatio = (parseFloat(left) - padding) / lastPosRect.width;
        this.appRef.style.left = `${padding + xRatio * posRect.width}px`;
      }

      if (oldTop < 0) {
        // Do nothing
      } else if (oldTop > lastPosRect.height) {
        this.appRef.style.top = `${padding + oldTop - lastPosRect.height + posRect.height}`;
      } else {
        const yRatio = (parseFloat(top) - padding) / lastPosRect.height;
        this.appRef.style.top = `${padding + yRatio * posRect.height}px`;
      }
    };

    window.addEventListener('resize', onResize);

    this.cleanupTasks.push(() => {
      window.removeEventListener('resize', onResize);
    });
  }

  componentWillUnmount() {
    this.cleanupTasks.run();
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
            {this.state.loading
              ? <div class="spinner"></div>
              : <div class="logo" style={{
                backgroundImage: `url("${(
                  document.querySelector('#elo-extension #icon-template') as HTMLImageElement
                ).src}")`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}></div>
            }
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
