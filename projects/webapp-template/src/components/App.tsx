import * as React from 'react';

import { usePageContext } from '../PageContext';
import IncrementButton from './IncrementButton';
import config from '../config';

const App: React.FunctionComponent = () => {
  const page = usePageContext(s => s.page);

  return <div>
    <div>Page: {page}</div>
    <div><IncrementButton/></div>
    <div><pre>{JSON.stringify(config, null, 2)}</pre></div>
  </div>;
};

export default App;
