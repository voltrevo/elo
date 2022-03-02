import * as React from 'react';

import { useEloPageContext } from '../EloPageContext';
import ReportsPage from './ReportsPage';
import WelcomePage from './WelcomePage';
import FeedbackPage from './FeedbackPage';
import Dialog from './Dialog';
import Nav from './Nav';
import ReportPrototype from './ReportPrototype';
import AccountPage from './AccountPage';

const EloPage: React.FunctionComponent = () => {
  const page = useEloPageContext(state => state.page);
  const dialog = useEloPageContext(state => state.dialog);

  const pageElement = (() => {
    if (page === 'WelcomePage') {
      return <WelcomePage />;
    }

    if (page === 'ReportsPage') {
      return <ReportsPage />;
    }

    if (page === 'OverviewPage') {
      return <ReportPrototype />;
    }

    if (page === 'AccountPage') {
      return <AccountPage />;
    }

    if (page === 'FeedbackPage') {
      return <FeedbackPage />;
    }

    return <>Page not found: "{page}"</>;
  })();

  return <div className="elo-page">
    <div className="main">
      <Nav/>
      <div className="page-content">
        {pageElement}
      </div>
    </div>
    {dialog && <Dialog>{dialog}</Dialog>}
  </div>;
};

export default EloPage;
