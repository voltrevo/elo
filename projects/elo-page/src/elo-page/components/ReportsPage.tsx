import * as React from 'react';
import nil from '../../common-pure/nil';
import { SessionPage } from '../../elo-extension-app/Protocol';

import EloPageContext from '../EloPageContext';
import ExtensionAppContext from '../ExtensionAppContext';
import SessionDateTime from './helpers/SessionDateTime';
import Page from './Page';

const pageSize = 15;

const ReportsPage: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);
  const appCtx = React.useContext(ExtensionAppContext);
  const [sessionPage, setSessionPage] = React.useState<SessionPage>();
  const [page, setPage] = React.useState(0);
  const [pageCount, setPageCount] = React.useState<number>();
  const pageFirstIds = React.useRef<(string | nil)[]>([]);

  React.useEffect(() => {
    (async () => {
      const newSessionPage = await appCtx.getSessionPage(pageSize, nil);

      pageFirstIds.current[0] = newSessionPage.entries[0]?.id;
      pageFirstIds.current[1] = newSessionPage.nextId;

      setSessionPage(newSessionPage);

      const sessionCount = await appCtx.getSessionCount();
      setPageCount(Math.max(1, Math.ceil(sessionCount / pageSize)));
    })();
  }, []);

  return <Page classes={['reports-page']}>
    <h1>Reports</h1>

    {!sessionPage && <>Loading...</>}

    {sessionPage && (() => {
      const list: React.ReactElement[] = [];

      let month: string | undefined = undefined;

      for (const { id, session } of sessionPage.entries) {
        const sessionMonth = renderMonth(new Date(session.start));

        if (sessionMonth !== month) {
          month = sessionMonth;
          list.push(<div className="month">{month}</div>);
        }

        list.push(<div
          className="session-item card"
          onClick={() => pageCtx.update({
            hash: `SessionReportPage?id=${id}`,
            cachedSession: { id, session },
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

          const newSessionPage = await appCtx.getSessionPage(pageSize, key);
          setSessionPage(newSessionPage);
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

          const newSessionPage = await appCtx.getSessionPage(pageSize, firstId);

          pageFirstIds.current[page + 2] = newSessionPage.nextId;
          setSessionPage(newSessionPage);
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
