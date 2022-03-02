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

export default class OverviewPage extends React.Component {
  totalChartRef?: HTMLCanvasElement;
  totalChart?: Chart;
  byTypeChartRef?: HTMLCanvasElement;
  byTypeChart?: Chart;

  render() {
    (window as any).pages ??= [];

    if (!(window as any).pages.includes(this)) {
      (window as any).pages.push(this);
    }

    setTimeout(() => this.renderCharts());

    return <Page classes={['sections', 'overview-page']}>
      <Section>
        <h1>Overview</h1>
      </Section>

      <Section>
        <div className="overview-stat-boxes">
          <div className="card">
            <div>
              <div className="bold">Sessions</div>
              <div className="very-prominent-number other-disfluent-fgcolor">16</div>
            </div>
          </div>
          <div className="card">
            <div>
              <div className="bold">Minutes Spoken</div>
              <div className="very-prominent-number other-disfluent-fgcolor">251</div>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="chart">
          <canvas ref={this.setTotalChartRef} style={{ height: '400px' }}></canvas>
        </div>

        <div className="chart">
          <canvas ref={this.setByTypeChartRef} style={{ height: '400px' }}></canvas>
        </div>
      </Section>
    </Page>;
  }

  setTotalChartRef = (r: HTMLCanvasElement | null | undefined) => {
    r = r ?? undefined;

    if (r !== this.totalChartRef) {
      this.totalChartRef = r;
      this.totalChart = undefined;
    }
  }

  setByTypeChartRef = (r: HTMLCanvasElement | null | undefined) => {
    r = r ?? undefined;

    if (r !== this.totalChartRef) {
      this.byTypeChartRef = r;
      this.byTypeChart = undefined;
    }
  }

  renderCharts() {
    if (this.totalChartRef !== undefined) {
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

      if (this.totalChart === undefined) {
        this.totalChart = new Chart(this.totalChartRef.getContext('2d')!, chartConfig);
      } else {
        this.totalChart.data = chartConfig.data;
        this.totalChart.update();
      }
    }

    if (this.byTypeChartRef !== undefined) {
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

      if (this.byTypeChart === undefined) {
        this.byTypeChart = new Chart(this.byTypeChartRef.getContext('2d')!, chartConfig);
      } else {
        this.byTypeChart.data = chartConfig.data;
        this.byTypeChart.update();
      }
    }
  }

  renderHours(durationMs: number) {
    this;
    return `${(durationMs / 3600000).toFixed(1)} hours`;
  }
}
