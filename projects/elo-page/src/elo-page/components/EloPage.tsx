import * as React from 'react';

import { useEloPageContext } from '../EloPageContext';
import ReportsPage from './ReportsPage';
import WelcomePage from './WelcomePage';
import FeedbackPage from './FeedbackPage';
import Dialog from './Dialog';
import Nav from './Nav';
import AccountPage from './AccountPage';
import Page from './Page';
import Section from './Section';
import Field from './Field';
import OverviewPage from './OverviewPage';
import SessionReportPage from './SessionReportPage';

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
      return <OverviewPage />;
    }

    if (page === 'AccountPage') {
      return <AccountPage />;
    }

    if (page === 'FeedbackPage') {
      return <FeedbackPage />;
    }

    if (page === 'SessionReportPage') {
      return <SessionReportPage />;
    }

    return <Page classes={['form-page']}>
      <Section>
        <h1>Not Found</h1>
        <Field>
          <div>page</div>
          <div>{page}</div>
        </Field>
      </Section>
    </Page>;
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
