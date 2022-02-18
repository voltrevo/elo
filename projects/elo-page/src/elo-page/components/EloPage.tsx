import * as React from 'react';

import { useEloPageContext } from '../EloPageContext';
import LastSessionPage from './LastSessionPage';
import AuthPage from './AuthPage';
import FeedbackDialog from './FeedbackDialog';
import Dialog from './Dialog';
import Nav from './Nav';

const EloPage: React.FunctionComponent = () => {
  const page = useEloPageContext(state => state.page);
  const dialog = useEloPageContext(state => state.dialog);

  const pageElement = (() => {
    if (page === 'AuthPage') {
      return <AuthPage />;
    }

    if (page === 'LastSessionPage') {
      return <LastSessionPage />;
    }

    return <>Page not found: "{page}"</>;
  })();

  const dialogElement = (() => {
    if (dialog === 'FeedbackDialog') {
      return <FeedbackDialog />;
    }

    return undefined;
  })();

  return <div className="elo-page">
    <div className="main">
      <Nav/>
      <div className="page-content">
        {pageElement}
      </div>
    </div>
    {dialogElement && <Dialog>{dialogElement}</Dialog>}
  </div>;
};

export default EloPage;
