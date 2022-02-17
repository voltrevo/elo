import * as React from 'react';

import { usePageContext } from '../PageContext';
import IncrementButton from './IncrementButton';

const App: React.FunctionComponent = () => {
  const page = usePageContext(s => s.page);

  return <>
    Page: {page}<br/>
    <IncrementButton/>
  </>;
};

export default App;
