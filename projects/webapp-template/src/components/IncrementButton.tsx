import * as React from 'react';

import PageContext from '../PageContext';

const IncrementButton: React.FunctionComponent = () => {
  const pageCtx = React.useContext(PageContext);

  return <button
    onClick={() => pageCtx.update({ counter: pageCtx.state.counter + 1 })}
  >
    Increment
  </button>;
};

export default IncrementButton;
