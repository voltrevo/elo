import * as React from 'react';

import { useEloPageContext } from '../EloPageContext';
import LastSessionPage from './LastSessionPage';
import AuthPage from './AuthPage';

const EloPage: React.FunctionComponent = () => {
  const page = useEloPageContext(state => state.page);

  if (page === 'AuthPage') {
    return <AuthPage />;
  }

  if (page === 'LastSessionPage') {
    return <LastSessionPage />;
  }

  return <>Page not found: "{page}"</>;
};

export default EloPage;
