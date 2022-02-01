import * as React from 'react';

import ContentAppClient from '../ContentAppClient';
import UiState from '../UiState';
import CollapseIcon from './CollapseIcon';
import ExpandIcon from './ExpandIcon';
import PopoutIcon from './PopoutIcon';

type Props = {
  contentApp: ReturnType<typeof ContentAppClient>,
};

const App: React.FunctionComponent<Props> = ({ contentApp }: Props) => {
  const dragData = React.useRef<{
    mouseDownPos: { x: number, y: number },
    appPosAtMouseDown: { x: number, y: number },
  }>();

  const appRef = React.useRef<HTMLDivElement>();
  const dragRef = React.useRef<HTMLDivElement>();

  const windowSize = React.useRef({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [uiState, setUiState] = React.useState(UiState());

  const [collapsed, setCollapsed] = React.useState(false);
  const [highlightFillerSound, setHighlightFillerSound] = React.useState(false);
  const [highlightFillerWord, setHighlightFillerWord] = React.useState(false);
  const [left, setLeft] = React.useState<string>();
  const [top, setTop] = React.useState<string>();

  React.useEffect(() => {
    let cleanedUp = false;

    (async () => {
      while (true) {
        const newUiState = await contentApp.getUiState(uiState.index);

        if (cleanedUp) {
          break;
        }

        if (newUiState.fillerSoundBox.count > uiState.fillerSoundBox.count) {
          setHighlightFillerSound(true);
          const count = newUiState.fillerSoundBox.count;

          setTimeout(() => {
            if (uiState.fillerSoundBox.count === count) {
              setHighlightFillerSound(false);
            }
          }, 3000);
        }

        if (newUiState.fillerWordBox.count > uiState.fillerWordBox.count) {
          setHighlightFillerWord(true);
          const count = newUiState.fillerWordBox.count;

          setTimeout(() => {
            if (uiState.fillerWordBox.count === count) {
              setHighlightFillerWord(false);
            }
          }, 3000);
        }

        setUiState(newUiState);
      }
    })();

    return () => { cleanedUp = true; };
  });

  const onResize = () => {
    const lastWindowSize = windowSize.current;

    windowSize.current = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    if (dragData.current !== undefined || appRef.current === undefined) {
      return;
    }

    const appLeft = appRef.current.style.left;
    const appTop = appRef.current.style.top;

    if (!appLeft.endsWith('px') || !appTop.endsWith('px')) {
      return;
    }

    const padding = 18;

    const elementRect = appRef.current.getBoundingClientRect();

    const lastPosRect = {
      width: lastWindowSize.width - 2 * padding - elementRect.width,
      height: lastWindowSize.height - 2 * padding - elementRect.height,
    };

    const posRect = {
      width: windowSize.current.width - 2 * padding - elementRect.width,
      height: windowSize.current.height - 2 * padding - elementRect.height,
    };

    const oldLeft = parseFloat(appLeft) - padding;
    const oldTop = parseFloat(appTop) - padding;

    if (oldLeft < 0) {
      // Do nothing
    } else if (oldLeft > lastPosRect.width) {
      appRef.current.style.left = `${padding + oldLeft - lastPosRect.width + posRect.width}`;
    } else {
      const xRatio = (parseFloat(appLeft) - padding) / lastPosRect.width;
      appRef.current.style.left = `${padding + xRatio * posRect.width}px`;
    }

    if (oldTop < 0) {
      // Do nothing
    } else if (oldTop > lastPosRect.height) {
      appRef.current.style.top = `${padding + oldTop - lastPosRect.height + posRect.height}`;
    } else {
      const yRatio = (parseFloat(appTop) - padding) / lastPosRect.height;
      appRef.current.style.top = `${padding + yRatio * posRect.height}px`;
    }
  };

  React.useEffect(() => {
    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  });

  const trySetupDragging = () => {
    if (appRef.current === undefined || dragRef.current === undefined) {
      return;
    }

    dragRef.current.addEventListener('mousedown', (evt) => {
      if (
        evt.button !== 0 ||
        dragData.current !== undefined ||
        appRef.current === undefined ||
        dragRef.current === undefined
      ) {
        return;
      }

      const appRect = appRef.current.getBoundingClientRect();

      dragData.current = {
        mouseDownPos: { x: evt.screenX, y: evt.screenY },
        appPosAtMouseDown: { x: appRect.left, y: appRect.top },
      };

      const mouseMoveListener = (moveEvt: MouseEvent) => {
        if (dragData.current === undefined || appRef.current === undefined) {
          return;
        }

        const diffPos = {
          x: moveEvt.screenX - dragData.current.mouseDownPos.x,
          y: moveEvt.screenY - dragData.current.mouseDownPos.y,
        };

        setLeft(`${dragData.current.appPosAtMouseDown.x + diffPos.x}px`);
        setTop(`${dragData.current.appPosAtMouseDown.y + diffPos.y}px`);
      };

      window.addEventListener('mousemove', mouseMoveListener);

      const mouseUpListener = () => {
        window.removeEventListener('mousemove', mouseMoveListener);
        window.removeEventListener('mouseup', mouseUpListener);
        dragData.current = undefined;
      };

      window.addEventListener('mouseup', mouseUpListener);
    });
  };

  const openDashboard = () => {
    contentApp.getDashboardUrl().then(dashboardUrl => {
      const anchorTag = document.createElement('a');
      anchorTag.href = dashboardUrl;
      anchorTag.setAttribute('target', '_blank');
      anchorTag.setAttribute('rel', 'noopener noreferrer');
      anchorTag.click();
    });
  };

  function render(): React.ReactElement {
    const classes = [
      'app',
      ...(uiState.active ? ['active'] : []),
      ...(collapsed ? ['collapsed'] : []),
    ];

    return <div
      className={classes.join(' ')}
      ref={r => {
        appRef.current = r ?? undefined;
        dragRef.current = r ?? undefined;
        trySetupDragging();
      }}
      style={{ left, top }}
    >
      <div className="app-content">{renderAppContent()}</div>
    </div>;
  }

  function renderAppContent(): React.ReactElement {
    if (collapsed) {
      return <div className="body">
        <ExpandIcon onAction={() => { setCollapsed(false); }}/>
        <div className="center common-centering">
          {uiState.loading
            ? <div className="spinner"></div>
            : <div className="logo" style={{
              backgroundImage: `url("${(
                document.querySelector('#elo-extension #icon-template') as HTMLImageElement
              ).src}")`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}></div>
          }
        </div>
      </div>;
    }

    return <>
      <CollapseIcon onAction={() => { setCollapsed(true); }}/>
      <PopoutIcon onAction={() => { openDashboard(); }}/>
      <div className="body">
        <div className="left spacer">
          <div className="word-box-container spacer">
            <div
              className={[
                'common-centering',
                'word-box',
                ...(highlightFillerSound ? ['highlight'] : []),
              ].join(' ')}
            >
              {uiState.fillerSoundBox.text}
            </div>
          </div>
          <div className="common-centering counter">
            {uiState.fillerSoundBox.metric}
          </div>
        </div>
        <div className="center common-centering">
          {uiState.loading
            ? <div className="spinner"></div>
            : <div className="logo" style={{
              backgroundImage: `url("${(
                document.querySelector('#elo-extension #icon-template') as HTMLImageElement
              ).src}")`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}></div>
          }
        </div>
        <div className="right spacer">
          <div className="common-centering counter">
            {uiState.fillerWordBox.metric}
          </div>
          <div className="word-box-container spacer">
            <div
              className={[
                'common-centering',
                'word-box',
                ...(highlightFillerWord ? ['highlight'] : []),
              ].join(' ')}
            >
              {uiState.fillerWordBox.text}
            </div>
          </div>
        </div>
      </div>
    </>;
  }

  return render();
};

export default App;
