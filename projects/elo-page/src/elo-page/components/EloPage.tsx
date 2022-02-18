import * as React from 'react';

import { useEloPageContext } from '../EloPageContext';
import ReportsPage from './ReportsPage';
import AuthPage from './AuthPage';
import FeedbackPage from './FeedbackPage';
import Dialog from './Dialog';
import Nav from './Nav';
import ReportPrototype from './ReportPrototype';

const EloPage: React.FunctionComponent = () => {
  const page = useEloPageContext(state => state.page);
  // const dialog = useEloPageContext(state => state.dialog);

  const pageElement = (() => {
    if (page === 'AuthPage') {
      return <AuthPage />;
    }

    if (page === 'ReportsPage') {
      return <ReportsPage />;
    }

    if (page === 'OverviewPage') {
      return <ReportPrototype />;
    }

    if (page === 'FeedbackPage') {
      return <FeedbackPage />;
    }

    return <>Page not found: "{page}"</>;
  })();

  const dialogElement = (() => {
    // if (dialog === 'FeedbackPage') {
    //   return <FeedbackPage />;
    // }

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
