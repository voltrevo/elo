import * as React from 'react';

import clamp from '../../common-pure/clamp';
import nil from '../../common-pure/nil';
import { SessionPage } from '../../elo-extension-app/Protocol';
import EloPageContext, { useEloPageContext } from '../EloPageContext';
import ExtensionAppContext from '../ExtensionAppContext';
import AsyncButton from './AsyncButton';
import FunctionalBarSelector from './FunctionalBarSelector';
import SessionDateTime from './helpers/SessionDateTime';
import Page from './Page';
import Section from './Section';
import EloDatePicker from './EloDatePicker';
import { initAggregateStats } from '../../elo-types/AggregateStats';
import accumulateStats from '../../elo-extension-app/accumulateStats';
import download from '../../elo-extension-app/helpers/download';

const pageSize = 15;

const ReportsPage: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);

  const selectedView: 'sessions' | 'range' | 'raw' = useEloPageContext(state => {
    const synthUrl = new URL(`http://example.com/${state.hash}`);
    const view = synthUrl.searchParams.get('v');

    switch (view) {
      case 'sessions':
        return 'sessions';
      case 'range':
        return 'range';
      case 'raw':
        return 'raw';
      case null:
        return 'sessions';

      default:
        console.warn('Unrecognized view:', view);
        return 'sessions';
    }
  });

  return (
    <Page classes={['reports-page']}>
      <h1>Reports</h1>

      <Section>
        <FunctionalBarSelector
          options={['sessions', 'range', 'raw']}
          selection={selectedView}
          onSelect={(sel) => pageCtx.update({ hash: `ReportsPage?v=${sel}` })}
          displayMap={{
            sessions: 'Sessions',
            range: 'Range',
            raw: 'Raw',
          }}
        />
      </Section>

      <Section>
        {{
          sessions: () => <BySession />,
          range: () => <ByRange />,
          raw: () => <RawDownload />,
        }[selectedView]()}
      </Section>
    </Page>
  );
};

export default ReportsPage;

const BySession: React.FunctionComponent = () => {
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

  return <>
    {!sessionPage && <>Loading...</>}

    {sessionPage && (() => {
      const list: React.ReactElement[] = [];

      let month: string | undefined = undefined;

      for (const { id, session } of sessionPage.entries) {
        const sessionMonth = renderMonth(new Date(session.start));

        if (sessionMonth !== month) {
          month = sessionMonth;
          list.push(<div key={month} className="month">{month}</div>);
        }

        list.push(<div
          key={id}
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
  </>;
};

const ByRange: React.FunctionComponent = () => {
  const appCtx = React.useContext(ExtensionAppContext);
  const pageCtx = React.useContext(EloPageContext);

  const [fromDate, setFromDate] = React.useState(
    new Date(Date.now() - 29 * 86_400_000),
  );

  const [toDate, setToDate] = React.useState(new Date());

  return <div className="by-range inner-form">
    <div className="presets">
      <div
        className="card"
        onClick={() => {
          setFromDate(new Date(Date.now() - 29 * 86_400_000));
          setToDate(new Date());
        }}
      >
        Last 30 Days
      </div>
      <div
        className="card"
        onClick={() => {
          setFromDate(new Date(Date.now() - 89 * 86_400_000));
          setToDate(new Date());
        }}
      >
        Last 90 Days
      </div>
      <div
        className="card"
        onClick={() => {
          const from = new Date();
          from.setDate(1);

          let to = new Date(Number(from) + 40 * 86_400_000);
          to.setDate(1);
          to = new Date(Number(to) - 86_400_000);

          setFromDate(from);
          setToDate(to);
        }}
      >
        This Month
      </div>
      <div
        className="card"
        onClick={() => {
          let from = new Date();
          from.setDate(1);
          from = new Date(Number(from) - 86_400_000);
          from.setDate(1);

          let to = new Date(Number(from) + 40 * 86_400_000);
          to.setDate(1);
          to = new Date(Number(to) - 86_400_000);

          setFromDate(from);
          setToDate(to);
        }}
      >
        Last Month
      </div>
    </div>
    <div className="date-range-row">
      <EloDatePicker
        value={fromDate}
        onChange={(newValue) => {
          if (newValue !== nil) {
            setFromDate(newValue);
          }
        }}
      />
      <div>to</div>
      <EloDatePicker
        value={toDate}
        onChange={(newValue) => {
          if (newValue !== nil) {
            setToDate(newValue);
          }
        }}
      />
    </div>
    <div className="button-column">
      <AsyncButton onClick={async () => {
        const minDate = new Date(fromDate);
        minDate.setHours(0);
        minDate.setMinutes(0);
        minDate.setSeconds(0);
        minDate.setMilliseconds(0);

        let maxDate = new Date(toDate);
        maxDate.setHours(0);
        maxDate.setMinutes(0);
        maxDate.setSeconds(0);
        maxDate.setMilliseconds(0);
        maxDate = new Date(Number(maxDate) + 86_400_000);

        const sessions = await appCtx.getSessionRange({
          minTime: Number(minDate),
          maxTime: Number(maxDate),
        });

        const aggregateStats = initAggregateStats();

        for (const session of sessions) {
          accumulateStats(aggregateStats, session);
        }

        pageCtx.update({
          rangeReport: {
            fromDate,
            toDate,
            stats: aggregateStats,
          },
          hash: 'RangeReportPage',
        });
      }}>Generate</AsyncButton>
    </div>
  </div>;
};

const RawDownload: React.FunctionComponent = () => {
  const appCtx = React.useContext(ExtensionAppContext);

  return <div className="by-range inner-form">
    <div className="button-column">
      <AsyncButton onClick={async () => {
        const sessions = await appCtx.getSessionRange({});

        const aggregateStats = initAggregateStats();

        for (const session of sessions) {
          accumulateStats(aggregateStats, session);
        }

        download(
          'elo-data.json',
          'application/json',
          JSON.stringify({ aggregateStats, sessions }, null, 2),
        );
      }}>Download All Raw Data</AsyncButton>
    </div>
  </div>;
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
