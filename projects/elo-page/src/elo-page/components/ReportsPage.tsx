import * as React from 'react';
import SessionStats from '../../elo-types/SessionStats';

import EloPageContext from '../EloPageContext';
import ExtensionAppContext from '../ExtensionAppContext';
import Page from './Page';

const pageSize = 50;

const ReportsPage: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);
  const appCtx = React.useContext(ExtensionAppContext);
  const [sessions, setSessions] = React.useState<SessionStats[]>();
  const [page, setPage] = React.useState(0);
  const pageKeys = React.useRef<(string | undefined)[]>([]);

  React.useEffect(() => {
    (async () => {
      const accountRoot = await appCtx.readAccountRoot();

      const lastSessionKey = accountRoot.lastSessionKey;
      pageKeys.current[0] = lastSessionKey;

      setSessions(await loadSessionsFrom(lastSessionKey));
    })();
  }, []);

  async function loadSessionsFrom(lastSessionKey: string | undefined) {
    const newSessions: SessionStats[] = [];

    while (newSessions.length < pageSize && lastSessionKey !== undefined) {
      const session = await pageCtx.storage.read(SessionStats, lastSessionKey);

      if (session === undefined) {
        break;
      }

      newSessions.push(session);
      lastSessionKey = session.lastSessionKey;
    }

    return newSessions;
  }

  return <Page>
    <h1>Reports</h1>

    {!sessions && <>Loading...</>}

    {sessions && <pre>{JSON.stringify(sessions, null, 2)}</pre>}
  </Page>;
};

export default ReportsPage;
