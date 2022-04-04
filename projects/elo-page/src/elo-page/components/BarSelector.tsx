import * as React from 'react';

import FunctionalBarSelector from './FunctionalBarSelector';

type Props = {
  classes?: string[];
  options: string[];
  displayMap?: Record<string, string>;
  default_?: {
    value: string;
    allowNoSelection: boolean;
  };
  onSelect?: (selection: string | undefined) => void;
};

const BarSelector: React.FunctionComponent<Props> = (
  {
    classes = [],
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

  return <FunctionalBarSelector
    classes={classes}
    options={options}
    displayMap={displayMap}
    selection={selection}
    onSelect={(newSelection) => doSelect(
      default_?.allowNoSelection !== false && newSelection === selection
        ? undefined
        : newSelection,
    )}
  />;
};

export default BarSelector;
