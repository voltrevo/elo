import * as React from 'react';
import SessionStats from '../../elo-types/SessionStats';
import ContentAppContext from '../ContentAppContext';

import EloPageContext from '../EloPageContext';
import SessionReport from './SessionReport';

const ReportsPage: React.FunctionComponent = () => {
  const eloClient = React.useContext(ContentAppContext);
  const pageCtx = React.useContext(EloPageContext);

  const [lastSession, setLastSession] = React.useState<SessionStats>();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const { lastSessionKey } = await pageCtx.storage.readRoot();

      if (lastSessionKey === undefined) {
        return;
      }

      setLastSession(await pageCtx.storage.read<SessionStats>(lastSessionKey));
    })().then(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <>Loading...</>;
  }

  if (lastSession === undefined) {
    return <>No last session</>;
  }

  return <SessionReport lastSession={lastSession} storage={pageCtx.storage}/>;
};

export default ReportsPage;
