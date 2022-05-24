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
  const pageFirstIds = React.useRef<(string | nil)[]>([]);

  React.useEffect(() => {
    (async () => {
      const sessionPage = await appCtx.getSessionPage(pageSize, nil);

      pageFirstIds.current[0] = sessionPage.firstId;
      pageFirstIds.current[1] = sessionPage.nextId;

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
        className={`pagination-link ${page <= 0 && 'disabled'}`}
        onClick={async (evt) => {
          const key = pageFirstIds.current[page - 1];

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
        className={`pagination-link ${((page + 1) >= (pageCount ?? 0)) && 'disabled'}`}
        onClick={async (evt) => {
          const firstId = pageFirstIds.current[page + 1];

          if (firstId === nil) {
            return;
          }

          const sessionPage = await appCtx.getSessionPage(pageSize, firstId);

          pageFirstIds.current[page + 2] = sessionPage.nextId;
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
