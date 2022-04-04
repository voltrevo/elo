import * as React from 'react';

type Props = {
  classes?: string[];
  options: string[];
  displayMap?: Record<string, string>;
  selection?: string;
  onSelect?: (selection: string | undefined) => void;
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
  return <div className={['bar-selector', ...classes].join(' ')}>
    {options.map(option => (
      <div
        className={`cell ${option === selection && 'selected'}`}
        onClick={() => onSelect(option === selection
            ? undefined
            : option,
        )}
      >
        {displayMap[option] ?? option}
      </div>
    ))}
  </div>;
};

export default FunctionalBarSelector;
