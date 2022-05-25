import * as React from 'react';

import {
  Chart,
  ChartConfiguration,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
} from 'chart.js';
import Page from './Page';
import Section from './Section';
import ExtensionAppContext from '../ExtensionAppContext';
import addCommas from './helpers/addCommas';
import AggregateStats from '../../elo-types/AggregateStats';
import EloPageContext from '../EloPageContext';
import SessionStats from '../../elo-types/SessionStats';
import ExtensionAppClient from '../ExtensionAppClient';
import nil from '../../common-pure/nil';
import { SessionPage } from '../../elo-extension-app/Protocol';

Chart.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
);

const weekLabels = [
  'five weeks ago',
  'four weeks ago',
  '3 weeks ago',
  '2 weeks ago',
  'last week',
  'this week',
];

const OverviewPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ExtensionAppContext);
  const pageCtx = React.useContext(EloPageContext);

  const [sessionCount, setSessionCount] = React.useState<number>();
  const [hoursSpoken, setHoursSpoken] = React.useState<number>();
  const [feature, setFeature] = React.useState<{ name: string, count: number }>();
  const [weeklyStats, setWeeklyStats] = React.useState<WeeklyStats>();

  React.useEffect(() => {
    (async () => {
      const aggregateStats = await appCtx.getAggregateStats();
      const accountRoot = await appCtx.readAccountRoot();

      setSessionCount(aggregateStats.sessionCount);
      setHoursSpoken(Math.floor(aggregateStats.speakingTime / 3600));
      setFeature(pickFeature(aggregateStats));

      if (accountRoot) {
        setWeeklyStats(await getWeeklyStats(appCtx));
      }
    })();
  }, []);

  return <Page classes={['sections', 'overview-page']}>
    <Section>
      <h1>Overview</h1>
    </Section>

    <Section>
      <div className="overview-stat-boxes">
        <div className="card">
          <div>
            <div className="bold">Sessions</div>
            <div className="very-prominent-number other-disfluent-fgcolor">{sessionCount && addCommas(sessionCount.toString())}</div>
          </div>
        </div>
        <div className="card">
          <div>
            <div className="bold">Hours Spoken</div>
            <div className="very-prominent-number other-disfluent-fgcolor">{hoursSpoken && addCommas(hoursSpoken.toFixed(1))}</div>
          </div>
        </div>
        <div className="card">
          <div>
            <div className="bold">"{feature && feature.name}"</div>
            <div className="very-prominent-number other-disfluent-fgcolor">{feature && addCommas(feature.count.toString())}</div>
          </div>
        </div>
      </div>
    </Section>

    <Section>
      <div className="chart">
        <canvas ref={r => r && weeklyStats && renderTotalChart(r, weeklyStats)} style={{ height: '400px' }}></canvas>
      </div>

      <div className="chart">
        <canvas ref={r => r && weeklyStats && renderByTypeChart(r, weeklyStats)} style={{ height: '400px' }}></canvas>
      </div>
    </Section>
  </Page>;
};

export default OverviewPage;

const charts = new WeakMap<HTMLCanvasElement, Chart>();

function renderTotalChart(totalChartRef: HTMLCanvasElement, weeklyStats: WeeklyStats) {
  const chartConfig: ChartConfiguration<'line'> = {
    type: 'line' as const,
    data: {
      labels: weekLabels,
      datasets: [{
        label: 'Total Per Minute Speaking',
        data: weeklyStats
          .map((stat) => (stat.fillersHedges + stat.umsUhs) / (stat.speakingTime / 60))
          .reverse(),
        fill: false,
        borderColor: 'rgb(0, 223, 223)',
        tension: 0.1,
      }],
    },
    options: {
      scales: {
        y: {
          min: 0,
        },
      },
      maintainAspectRatio: false,
    },
  };

  let chart = charts.get(totalChartRef);

  if (chart === undefined) {
    chart = new Chart(totalChartRef.getContext('2d')!, chartConfig);
    charts.set(totalChartRef, chart);
  } else {
    chart.data = chartConfig.data;
    chart.update();
  }
}

function renderByTypeChart(byTypeChartRef: HTMLCanvasElement, weeklyStats: WeeklyStats) {
  const chartConfig: ChartConfiguration<'line'> = {
    type: 'line' as const,
    data: {
      labels: weekLabels,
      datasets: [
        {
          label: 'Ums & Uhs',
          data: weeklyStats
            .map((stat) => (stat.umsUhs) / (stat.speakingTime / 60))
            .reverse(),
          fill: false,
          borderColor: 'rgb(0, 200, 255)',
          tension: 0.1,
        },
        {
          label: 'Filler & Hedge Words',
          data: weeklyStats
            .map((stat) => (stat.fillersHedges) / (stat.speakingTime / 60))
            .reverse(),
          fill: false,
          borderColor: 'rgb(179, 0, 255)',
          tension: 0.1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          min: 0,
        },
      },
      maintainAspectRatio: false,
    },
  };

  let chart = charts.get(byTypeChartRef);

  if (chart === undefined) {
    chart = new Chart(byTypeChartRef.getContext('2d')!, chartConfig);
    charts.set(byTypeChartRef, chart);
  } else {
    chart.data = chartConfig.data;
    chart.update();
  }
}

function pickFeature(aggregateStats: AggregateStats) {
  let sum = 0;

  for (const category of Object.values(aggregateStats.featureCounts)) {
    for (const count of Object.values(category)) {
      sum += count;
    }
  }

  let chosenIndex = Math.floor(Math.random() * sum);
  let sum2 = 0;

  for (const category of Object.values(aggregateStats.featureCounts)) {
    for (const [name, count] of Object.entries(category)) {
      sum2 += count;

      if (sum2 >= chosenIndex) {
        return { name, count };
      }
    }
  }
}

type WeeklyStats = {
  speakingTime: number,
  umsUhs: number,
  fillersHedges: number,
}[];

async function getWeeklyStats(appCtx: ReturnType<typeof ExtensionAppClient>): Promise<WeeklyStats> {
  const now = Date.now();
  const thisWeek = getWeekNumber(now);

  function getRelativeWeekIndex(t: number) {
    const week = getWeekNumber(t);
    return thisWeek - week;
  }

  function initWeekStats(): WeeklyStats[number] {
    return {
      speakingTime: 0,
      umsUhs: 0,
      fillersHedges: 0,
    };
  }

  const result: WeeklyStats = [];
  let nextId: string | nil = nil;

  sessionIteration:
  while (true) {
    const sessionPage: SessionPage = await appCtx.getSessionPage(30, nextId);

    for (const session of sessionPage.sessions) {
      const relativeWeek = getRelativeWeekIndex(session.start);

      if (relativeWeek === weekLabels.length) {
        break sessionIteration;
      }
  
      result[relativeWeek] = result[relativeWeek] ?? initWeekStats();
  
      result[relativeWeek].speakingTime += session.speakingTime;
      result[relativeWeek].umsUhs += countUmsUhs(session);
      result[relativeWeek].fillersHedges += countFillersHedges(session);
    }

    nextId = sessionPage.nextId;

    if (nextId === nil) {
      break;
    }
  }

  while (result.length < weekLabels.length) {
    result.push(initWeekStats());
  }

  return result;
}

function getWeekNumber(t: number) {
  return Math.ceil((t + 4 * 86400000) / (7 * 86400000));
}

function countUmsUhs(session: SessionStats) {
  return sum(Object.values(session.featureCounts.filler ?? {}));
}

function countFillersHedges(session: SessionStats) {
  let total = 0;

  for (const [categoryName, category] of Object.entries(session.featureCounts)) {
    if (categoryName === 'filler') {
      continue;
    }

    total += sum(Object.values(category));
  }

  return total;
}

function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0);
}
