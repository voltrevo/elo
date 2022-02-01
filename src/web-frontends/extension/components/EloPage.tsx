import * as React from 'react';

import { useEloPageContext } from '../EloPageContext';
import LastSessionPage from './LastSessionPage';
import SignUpPage from './SignupPage';

const EloPage: React.FunctionComponent = () => {
  const page = useEloPageContext(state => state.page);

  if (page === 'SignUpPage') {
    return <SignUpPage />;
  }

  if (page === 'LastSessionPage') {
    return <LastSessionPage />;
  }

  return <>Page not found: "{page}"</>;
};

export default EloPage;
