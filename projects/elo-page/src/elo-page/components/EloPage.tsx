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
import SettingsPage from './SettingsPage';
import UserStatsPage from './UserStatsPage';
import ConnectZoomPage from './ConnectZoomPage';
import RangeReportPage from './RangeReportPage';

const EloPage: React.FunctionComponent = () => {
  const page = useEloPageContext(state => {
    const synthUrl = new URL(`http://example.com/${state.hash}`);
    return synthUrl.pathname.slice(1);
  });

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

    if (page === 'SettingsPage') {
      return <SettingsPage />;
    }

    if (page === 'FeedbackPage') {
      return <FeedbackPage />;
    }

    if (page === 'SessionReportPage') {
      return <SessionReportPage />;
    }

    if (page === 'UserStatsPage') {
      return <UserStatsPage />;
    }

    if (page === 'ConnectZoomPage') {
      return <ConnectZoomPage />;
    }

    if (page === 'RangeReportPage') {
      return <RangeReportPage />;
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
