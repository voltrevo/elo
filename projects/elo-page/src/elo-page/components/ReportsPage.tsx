import * as React from 'react';
import clamp from '../../common-pure/clamp';
import nil from '../../common-pure/nil';
import { SessionPage } from '../../elo-extension-app/Protocol';

import EloPageContext, { useEloPageContext } from '../EloPageContext';
import ExtensionAppContext from '../ExtensionAppContext';
import SessionDateTime from './helpers/SessionDateTime';
import Page from './Page';

const pageSize = 15;

const ReportsPage: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);
  const appCtx = React.useContext(ExtensionAppContext);
  const [pageCount, setPageCount] = React.useState<number>();
  const pageCache = React.useRef<(SessionPage | nil)[]>([]);
  const pagesLoading = React.useRef<(Promise<SessionPage | nil> | nil)[]>([]);
  const lastRenderedPageNumber = React.useRef<number>();
  const scrollTarget = React.useRef<HTMLElement>();
  const [, setRandom] = React.useState<number>();

  const pageNumber = useEloPageContext(state => {
    const synthUrl = new URL(`http://example.com/${state.hash}`);
    const p = Number(synthUrl.searchParams.get('p'));

    return Number.isFinite(p) ? clamp(1, p, pageCount ?? Infinity) : 1;
  });

  function setPageNumber(p: number) {
    p = clamp(1, p, pageCount ?? Infinity);

    pageCtx.update({
      hash: `ReportsPage?p=${p}`,
    });
  }

  async function getPage(p: number): Promise<SessionPage | nil> {
    if (pageCache.current[p]) {
      return pageCache.current[p];
    }

    if (pagesLoading.current[p]) {
      return await pagesLoading.current[p];
    }

    const promise = appCtx.getSessionPage(pageSize, p);
    pagesLoading.current[p] = promise;
    const newSessionPage = await promise;
    pageCache.current[p] = newSessionPage;
    return newSessionPage;
  }

  React.useEffect(() => {
    (async () => {
      const [, sessionCount] = await Promise.all([
        getPage(pageNumber),
        await appCtx.getSessionCount(),
      ]);

      setPageCount(Math.max(1, Math.ceil(sessionCount / pageSize)));
    })();
  }, []);

  const sessionPage = pageCache.current[pageNumber];

  if (sessionPage && lastRenderedPageNumber.current !== pageNumber) {
    lastRenderedPageNumber.current = pageNumber;
    
    const st = scrollTarget.current;
    setTimeout(() => st?.scrollIntoView());
    
    scrollTarget.current = nil;
  }

  if (!sessionPage) {
    setTimeout(async () => {
      if (await getPage(pageNumber) !== nil) {
        // FIXME: The way this page works has gotten messy. This technique for manually
        // re-rendering should currently be ok but the pattern risks nasty render loops.
        setRandom(Math.random());
      }
    });
  }

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
        className={`pagination-link ${pageNumber <= 1 && 'disabled'}`}
        onClick={async (evt) => {
          setPageNumber(pageNumber - 1);
          scrollTarget.current = evt.target as HTMLElement;
        }}
      >&lt;</div>
      <div>{pageNumber}/{pageCount}</div>
      <div
        className={`pagination-link ${((pageNumber) >= (pageCount ?? 0)) && 'disabled'}`}
        onClick={async (evt) => {
          setPageNumber(pageNumber + 1);
          scrollTarget.current = evt.target as HTMLElement;
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
