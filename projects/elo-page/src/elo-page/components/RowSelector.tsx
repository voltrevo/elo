import * as React from 'react';

type Props = {
  options: string[];
  displayMap?: Record<string, string>;
  default_?: {
    value: string;
    allowNoSelection: boolean;
  };
  onSelect?: (selection: string | undefined) => void;
};

const RowSelector: React.FunctionComponent<Props> = (
  {
    options,
    displayMap = {},
    default_,
    onSelect = () => {},
  }: Props,
) => {
  const [selection, setSelection] = React.useState<string | undefined>(default_?.value);

  function doSelect(value: string | undefined) {
    setSelection(value);
    onSelect(value);
  }

  React.useEffect(() => {
    doSelect(selection);
  }, []);

  return <div className="row-selector">
    {options.map(option => (
      <div>
        <span
          className={`cell ${option === selection && 'selected'}`}
          onClick={() => doSelect(
            default_?.allowNoSelection !== false && option === selection
              ? undefined
              : option,
          )}
        >
          {displayMap[option] ?? option}
        </span>
      </div>
    ))}
  </div>;
};

export default RowSelector;
