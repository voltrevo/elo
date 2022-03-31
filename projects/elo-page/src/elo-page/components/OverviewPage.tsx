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

const OverviewPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ExtensionAppContext);

  const [sessionCount, setSessionCount] = React.useState<number>();
  const [hoursSpoken, setHoursSpoken] = React.useState<number>();
  const [feature, setFeature] = React.useState<{ name: string, count: number }>();

  React.useEffect(() => {
    (async () => {
      const aggregateStats = await appCtx.getAggregateStats();

      setSessionCount(aggregateStats.sessionCount);
      setHoursSpoken(Math.floor(aggregateStats.speakingTime / 3600));
      setFeature(pickFeature(aggregateStats));
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
        <canvas ref={r => r && renderTotalChart(r)} style={{ height: '400px' }}></canvas>
      </div>

      <div className="chart">
        <canvas ref={r => r && renderByTypeChart(r)} style={{ height: '400px' }}></canvas>
      </div>
    </Section>
  </Page>;
};

export default OverviewPage;

const charts = new WeakMap<HTMLCanvasElement, Chart>();

function renderTotalChart(totalChartRef: HTMLCanvasElement) {
  const chartConfig: ChartConfiguration<'line'> = {
    type: 'line' as const,
    data: {
      labels: [
        'five weeks ago',
        'four weeks ago',
        '3 weeks ago',
        '2 weeks ago',
        'last week',
        'this week',
      ],
      datasets: [{
        label: 'Total Per Minute Speaking',
        data: [6.5, 6.3, 5.8, 6.1, 5.4, 4.8],
        fill: false,
        borderColor: 'rgb(0, 223, 223)',
        tension: 0.1,
      }],
    },
    options: {
      scales: {
        y: {
          min: 0,
          max: 8,
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

function renderByTypeChart(byTypeChartRef: HTMLCanvasElement) {
  const chartConfig: ChartConfiguration<'line'> = {
    type: 'line' as const,
    data: {
      labels: [
        'five weeks ago',
        'four weeks ago',
        '3 weeks ago',
        '2 weeks ago',
        'last week',
        'this week',
      ],
      datasets: [
        {
          label: 'Ums & Uhs',
          data: [3.5, 3.4, 3.4, 3.3, 2.5, 2.1],
          fill: false,
          borderColor: 'rgb(0, 200, 255)',
          tension: 0.1,
        },
        {
          label: 'Filler & Hedge Words',
          data: [3, 2.9, 2.4, 2.8, 2.9, 2.7],
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
          max: 4,
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
