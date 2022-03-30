import * as React from 'react';
import AccountRoot from '../../elo-extension-app/storage/AccountRoot';
import SessionStats from '../../elo-types/SessionStats';

import EloPageContext from '../EloPageContext';
import SessionReport from './SessionReport';

const SingleReportPage: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);

  const [lastSession, setLastSession] = React.useState<SessionStats>();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const root = await pageCtx.storage.readRoot();
      
      if (root.accountRoot === undefined) {
        return;
      }

      const { lastSessionKey } = await pageCtx.storage.read(AccountRoot, root.accountRoot) ?? {};

      if (lastSessionKey === undefined) {
        return;
      }

      setLastSession(await pageCtx.storage.read(SessionStats, lastSessionKey));
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

export default SingleReportPage;
