import * as React from 'react';
import SessionStats from '../../elo-types/SessionStats';

import EloPageContext from '../EloPageContext';
import ExtensionAppContext from '../ExtensionAppContext';
import SessionDateTime from './helpers/SessionDateTime';
import Page from './Page';

const pageSize = 15;

const ReportsPage: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);
  const appCtx = React.useContext(ExtensionAppContext);
  const [sessions, setSessions] = React.useState<SessionStats[]>();
  const [page, setPage] = React.useState(0);
  const [pageCount, setPageCount] = React.useState<number>();
  const pageKeys = React.useRef<(string | undefined)[]>([]);

  React.useEffect(() => {
    (async () => {
      const accountRoot = await appCtx.readAccountRoot();

      const lastSessionKey = accountRoot.lastSessionKey;
      pageKeys.current[0] = lastSessionKey;

      setSessions(await loadSessionsFrom(lastSessionKey));

      const aggStats = await appCtx.getAggregateStats();
      setPageCount(Math.ceil(aggStats.sessionCount / pageSize));
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

  return <Page classes={['reports-page']}>
    <h1>Reports</h1>

    {!sessions && <>Loading...</>}

    {sessions && (() => {
      const list: React.ReactElement[] = [];

      let month: string | undefined = undefined;

      for (const session of sessions) {
        const sessionMonth = renderMonth(new Date(session.start));

        if (sessionMonth !== month) {
          month = sessionMonth;
          list.push(<div className="month">{month}</div>);
        }

        list.push(<div
          className="session-item card"
          onClick={() => pageCtx.update({
            page: 'SessionReportPage',
            session,
          })}
        >
          <div className="title">
            {session.title}
          </div>
          <div>
            {SessionDateTime(session)}
          </div>
        </div>);
      }

      return <div className="list-container">
        {list}
      </div>;
    })()}
    <div className="pagination-footer">
      <div
        className={`pagination-link ${!pageKeys.current[page - 1] && 'disabled'}`}
        onClick={async (evt) => {
          const key = pageKeys.current[page - 1];

          if (key === undefined) {
            return;
          }

          setSessions(await loadSessionsFrom(key));
          setPage(page - 1);

          setTimeout(() => {
            (evt.target as HTMLDivElement).scrollIntoView();
          });
        }}
      >&lt;</div>
      <div>{page + 1}/{pageCount}</div>
      <div
        className={`pagination-link ${(!sessions || sessions[sessions.length - 1].lastSessionKey === undefined) && 'disabled'}`}
        onClick={async (evt) => {
          const lastSessionKey = sessions?.[sessions.length - 1]?.lastSessionKey;

          if (lastSessionKey === undefined) {
            return;
          }

          const newSessions = await loadSessionsFrom(lastSessionKey);
          pageKeys.current[page + 1] = lastSessionKey;
          setSessions(newSessions);
          setPage(page + 1);

          setTimeout(() => {
            (evt.target as HTMLDivElement).scrollIntoView();
          });
        }}
      >&gt;</div>
    </div>
  </Page>;
};

function renderMonth(t: Date) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return `${months[t.getMonth()]} ${t.getFullYear()}`;
}

export default ReportsPage;
