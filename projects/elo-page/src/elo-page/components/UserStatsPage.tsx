import * as React from 'react';

import Page from './Page';
import Section from './Section';
import ExtensionAppContext from '../ExtensionAppContext';
import AsyncReturnType from '../../common-pure/AsyncReturnType';
import IBackendApi from '../../elo-extension-app/IBackendApi';

type MonthlyStats = AsyncReturnType<IBackendApi['monthlyStats']>;

const UserStatsPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ExtensionAppContext);

  const [monthlyStats, setMonthlyStats] = React.useState<MonthlyStats>();

  React.useEffect(() => {
    (async () => {
      setMonthlyStats(await appCtx.getMonthlyStats());
    })();
  }, []);

  return <Page classes={['sections', 'overview-page']}>
    <Section>
      <h1>User Stats</h1>
    </Section>

    {!monthlyStats && <Section>
      <div>Loading...</div>
    </Section>}

    {monthlyStats && <Section>
      <pre>{JSON.stringify(monthlyStats, null, 2)}</pre>
    </Section>}
  </Page>;
};

export default UserStatsPage;
