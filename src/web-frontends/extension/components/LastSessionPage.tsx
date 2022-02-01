import * as React from 'react';

import EloPageContext from '../EloPageContext';
import SessionStats from '../storage/SessionStats';
import SessionReport from './SessionReport';

const LastSessionPage: React.FunctionComponent = () => {
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
      setLoading(false);
    })();
  });

  if (loading) {
    return <>Loading...</>;
  }

  if (lastSession === undefined) {
    return <>No last session</>;
  }

  return <SessionReport lastSession={lastSession} storage={pageCtx.storage}/>;
};

export default LastSessionPage;
