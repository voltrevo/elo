import * as React from 'react';

import PageContext, { usePageContext } from '../PageContext';
import IncrementButton from './IncrementButton';

const App: React.FunctionComponent = () => {
  const pageCtx = React.useContext(PageContext);
  const page = usePageContext(s => s.page);
  const count = usePageContext(s => s.counter);

  return <div>
    <div>Page: {page}</div>
    <div>Count: {count}</div>
    <div><IncrementButton/></div>
    <div><pre>{JSON.stringify(pageCtx.config, null, 2)}</pre></div>
  </div>;
};

export default App;
