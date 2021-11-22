import * as preact from 'preact';

import never from '../../../helpers/never';
import TaskQueue from '../../../helpers/TaskQueue';
import EwmaCalculator from '../../helpers/EwmaCalculator';
import ContentAppClient from '../ContentAppClient';
import UiState from '../UiState';

type Props = {
  contentApp: ReturnType<typeof ContentAppClient>,
};

type WordBox = {
  word: string;
  count: number;
  highlight: boolean;
  highlightTimerId?: number;
};

type State = {
  uiState: UiState;

  left?: string;
  top?: string;

  highlightFillerSound: boolean;
  highlightFillerWord: boolean;

  dashboardUrl: string;
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

  constructor(props: Props) {
    super(props);

    this.state = {
      uiState: UiState(),
      highlightFillerSound: false,
      highlightFillerWord: false,
      dashboardUrl: '#',
    };

    this.props.contentApp.getDashboardUrl().then(dashboardUrl => {
      this.setState({ dashboardUrl });
    });
  }

  componentWillMount() {
    let cleanedUp = false;

    this.cleanupTasks.push(() => {
      cleanedUp = true;
    });

    (async () => {
      while (true) {
        const newUiState = await this.props.contentApp.getUiState(this.state.uiState.index);

        if (cleanedUp) {
          break;
        }

        const highlights: Partial<State> = {};

        if (newUiState.fillerSoundBox.count > this.state.uiState.fillerSoundBox.count) {
          highlights.highlightFillerSound = true;
          const count = newUiState.fillerSoundBox.count;

          setTimeout(() => {
            if (this.state.uiState.fillerSoundBox.count === count) {
              this.setState({
                highlightFillerSound: false,
              });
            }
          }, 3000);
        }

        if (newUiState.fillerWordBox.count > this.state.uiState.fillerWordBox.count) {
          highlights.highlightFillerWord = true;
          const count = newUiState.fillerWordBox.count;

          setTimeout(() => {
            if (this.state.uiState.fillerWordBox.count === count) {
              this.setState({
                highlightFillerWord: false,
              });
            }
          }, 3000);
        }

        this.setState({ uiState: newUiState, ...highlights });
      }
    })();

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
      if (
        evt.button !== 0 ||
        this.dragData !== null ||
        this.appRef === null ||
        this.dragRef === null
      ) {
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
    const { uiState, left = '', top = '' } = this.state;

    return <div
      class={uiState.active ? 'app active' : 'app'}
      ref={r => {
        this.appRef = r;
        this.dragRef = r;
        this.trySetupDragging();
      }}
      style={{ left, top }}
    >
      <div class="body">
        <div class="left spacer">
          <div class="word-box-container spacer">
            <div
              class={[
                'common-centering',
                'word-box',
                ...(this.state.highlightFillerSound ? ['highlight'] : []),
              ].join(' ')}
            >
              {uiState.fillerSoundBox.text}
            </div>
          </div>
          <div class="common-centering counter">
            {uiState.fillerSoundBox.metric}
          </div>
        </div>
        <div class="center common-centering">
          <a
            class="content common-centering"
            href={this.state.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex' }}
          >
            {uiState.loading
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
          </a>
        </div>
        <div class="right spacer">
          <div class="common-centering counter">
            {uiState.fillerWordBox.metric}
          </div>
          <div class="word-box-container spacer">
            <div
              class={[
                'common-centering',
                'word-box',
                ...(this.state.highlightFillerWord ? ['highlight'] : []),
              ].join(' ')}
            >
              {uiState.fillerWordBox.text}
            </div>
          </div>
        </div>
      </div>
    </div>;
  }
}
