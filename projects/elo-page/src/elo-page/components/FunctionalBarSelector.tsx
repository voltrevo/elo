import { CircleNotch, XCircle } from 'phosphor-react';
import * as React from 'react';

type Props = {
  classes?: string[];
  options: string[];
  displayMap?: Record<string, string>;
  selection?: string;
  onSelect?: (selection: string | undefined) => unknown;
};

const FunctionalBarSelector: React.FunctionComponent<Props> = (
  {
    classes = [],
    options,
    displayMap = {},
    selection,
    onSelect = () => {},
  }: Props,
) => {
  let [progressState, setProgressState] = React.useState<'rest' | 'loading' | Error>('rest');
  let [loadingStartedTime, setLoadingStartedTime] = React.useState(0);
  let [lastUpdateTime, setLastUpdateTime] = React.useState(0);

  return <div className="bar-selector-wrapper">
    <div className={['bar-selector', ...classes].join(' ')}>
      {options.map(option => (
        <div
          key={option}
          className={`cell ${option === selection && 'selected'}`}
          onClick={async () => {
            if (progressState === 'loading') {
              console.warn('Ignoring click while loading');
              return;
            }

            const clickTime = Date.now();

            setTimeout(() => {
              setLoadingStartedTime(clickTime);
            }, 200);

            try {
              setProgressState('loading');

              await onSelect(option === selection
                ? undefined
                : option,
              );

              setProgressState('rest');
            } catch (error) {
              setProgressState(error as Error);
            } finally {
              setLastUpdateTime(Date.now());
            }
          }}
        >
          {displayMap[option] ?? option}
        </div>
      ))}
    </div>
    {progressState === 'loading' && loadingStartedTime > lastUpdateTime && <div className="progress-state spinner">
      <CircleNotch size={24} />
    </div>}
    {progressState instanceof Error && <div className="progress-state">
      <XCircle size={24} />
      <div className="bar-error-wrapper">
        <div className="bar-error">
          {progressState.message}
        </div>
      </div>
    </div>}
  </div>;
};

export default FunctionalBarSelector;
