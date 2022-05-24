import * as React from 'react';
import nil from '../../common-pure/nil';
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
  const pageKeys = React.useRef<(number | nil)[]>([]);

  React.useEffect(() => {
    (async () => {
      const now = Date.now();
      const sessionPage = await appCtx.getSessionPage(pageSize, now);

      pageKeys.current[0] = now;

      setSessions(sessionPage.sessions);

      const sessionCount = await appCtx.getSessionCount();
      setPageCount(Math.max(1, Math.ceil(sessionCount / pageSize)));
    })();
  }, []);

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

          const sessionPage = await appCtx.getSessionPage(pageSize, key);
          setSessions(sessionPage.sessions);
          setPage(page - 1);

          setTimeout(() => {
            (evt.target as HTMLDivElement).scrollIntoView();
          });
        }}
      >&lt;</div>
      <div>{page + 1}/{pageCount}</div>
      <div
        className={`pagination-link ${(sessions?.[sessions.length - 1]?.lastSessionKey === undefined) && 'disabled'}`}
        onClick={async (evt) => {
          const earliestStartOnPage = sessions?.[sessions.length - 1]?.start;

          if (earliestStartOnPage === nil) {
            return;
          }

          // TODO: Try going past the last page

          const sessionPage = await appCtx.getSessionPage(pageSize, earliestStartOnPage);
          let key = sessionPage.sessions[0]?.start;

          if (key) {
            key += 5000;
          }

          pageKeys.current[page + 1] = key;
          setSessions(sessionPage.sessions);
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
