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
import AsyncReturnType from '../../common-pure/AsyncReturnType';
import IBackendApi from '../../elo-extension-app/IBackendApi';

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

type MonthlyStats = AsyncReturnType<IBackendApi['monthlyStats']>;

const UserStatsPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ExtensionAppContext);

  const [monthlyStats, setMonthlyStats] = React.useState<MonthlyStats>();

  React.useEffect(() => {
    (async () => {
      setMonthlyStats(await appCtx.getMonthlyStats());
    })();
  }, []);

  return <Page classes={['sections', 'overview-page']}>
    <Section>
      <h1>User Stats</h1>
    </Section>

    {!monthlyStats && <Section>
      <div>Loading...</div>
    </Section>}

    {monthlyStats && <>
      <div className="chart">
        <canvas ref={r => r && renderChart(r, monthlyStats)} style={{ height: '400px' }}></canvas>
      </div>
    </>}
  </Page>;
};

export default UserStatsPage;

const charts = new WeakMap<HTMLCanvasElement, Chart>();

function renderChart(chartRef: HTMLCanvasElement, monthlyStats: MonthlyStats) {
  monthlyStats = monthlyStats.slice().reverse();

  const lines = [
    {
      key: 'activeUsers' as const,
      label: 'Active Users',
    },
    {
      key: 'spokenHours' as const,
      label: 'Spoken Hours',
    },
    {
      key: 'streamedHours' as const,
      label: 'Streamed Hours',
    },
    {
      key: 'sessions' as const,
      label: 'Sessions',
    },
  ];

  const angleIncrement = 360 / ((1 + Math.sqrt(5)) / 2);

  const chartConfig: ChartConfiguration<'line'> = {
    type: 'line' as const,
    data: {
      labels: monthlyStats.map(m => m.month),
      datasets: lines.map(({ key, label }, i) => ({
        label,
        data: monthlyStats.map(m => m[key]),
        fill: false,
        borderColor: `hsl(${angleIncrement * i}deg, 100%, 50%)`,
        tension: 0.1,
        hidden: key !== 'activeUsers',
      })),
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

  let chart = charts.get(chartRef);

  if (chart === undefined) {
    chart = new Chart(chartRef.getContext('2d')!, chartConfig);
    charts.set(chartRef, chart);
  } else {
    chart.data = chartConfig.data;
    chart.update();
  }
}
