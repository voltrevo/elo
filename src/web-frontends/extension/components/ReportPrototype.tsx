import * as preact from 'preact';

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

const sampleData = {
  totalSessions: 10,
  totalDuration: 4123000,
  sessions: [
    {
      startTime: 1634192105564,
      endTime: 1634192195564,
      url: 'https://meet.google.com/ipo-dwas-gvo',
      disfluencies: 20,
      avoidables: 13,
    },
  ],
};

export default class ReportPrototype extends preact.Component {
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

    return <div class="elo-page">
      <div class="elo-page-container">
        <img src="/assets/icons/icon128.png" width="64" height="64" />

        <div class="sections">
          <div/>
          <div class="heading">
            <div>
              <div class="your-weekly-report">Your Weekly Report</div>
              <div>Nov 8-14, 2021</div>
              <div class="stats">
                <table>
                  <thead></thead>
                  <tbody>
                    <tr>
                      <td>Sessions Logged</td>
                      <td class="important-value numeric">12</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>Speaking Time</td>
                      <td class="important-value numeric">123</td>
                      <td>min</td>
                    </tr>
                    <tr>
                      <td>Total Time</td>
                      <td class="important-value numeric">280</td>
                      <td>min</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div class="user-label">User</div>
              <div class="user-proper-name">Alexander Nick</div>
            </div>
          </div>

          <div class="single-stat-boxes">
            <div class="card">
              <div class="bold">Total</div>
              <div>
                <span class="very-prominent-number third-accent-fgcolor">4.8</span>
                <span class="bold">&nbsp;per minute speaking</span>
              </div>
              <div>
                <span class="bold third-accent-fgcolor">That’s pretty good!</span> The optimum frequency is
                one filler per minute, but the average speaker uses five fillers per minute
                (<a href="https://hbr.org/2018/08/how-to-stop-saying-um-ah-and-you-know">source</a>).
                Keep improving with Elo and you’ll get there.
              </div>
            </div>
            <div class="card">
              <div class="bold">Ums &amp; Uhs</div>
              <div>
                <span class="very-prominent-number filler-fgcolor">2.1</span>
                <span class="bold">&nbsp;per minute speaking</span>
              </div>
              <div>
                Keep paying attention to your ums and uhs till you catch yourself about to use them.
                Then, err on silence instead to develop a smoother, polished delivery.
              </div>
            </div>
            <div class="card">
              <div class="bold">Filler &amp; Hedge Words</div>
              <div>
                <span class="very-prominent-number other-disfluent-fgcolor">2.7</span>
                <span class="bold">&nbsp;per minute speaking</span>
              </div>
              <div>
                Your most used filler word this week was
                “<span class="bold other-disfluent-fgcolor">like</span>”.
                <p>
                  By eliminating fillers and hedge words you boost your credibility by speaking with
                  authority and conviction.
                </p>
              </div>
            </div>
          </div>

          <div class="card">
            <canvas ref={this.setTotalChartRef} style={{ height: '400px' }}></canvas>
          </div>

          <div class="card">
            <canvas ref={this.setByTypeChartRef} style={{ height: '400px' }}></canvas>
          </div>

          <div class="overview">
            <div class="bold other-disfluent-fgcolor">Overview</div>
            <hr class="overview-underline" />
            <div class="overview-sections">
              <div>
                <div>
                  Expressions to Avoid
                  <hr/>
                </div>
                <div class="overview-subtext">
                  Tip: You can select which expressions Elo looks out for by clicking on the
                  dropdown in a video conference.
                </div>
                <table>
                  <thead></thead>
                  <tbody>
                    <tr>
                      <td>like</td><td>40</td>
                    </tr>
                    <tr>
                      <td>so...</td><td>22</td>
                    </tr>
                    <tr>
                      <td>ok, so...</td><td>10</td>
                    </tr>
                    <tr>
                      <td>I mean...</td><td>6</td>
                    </tr>
                    <tr>
                      <td>right?</td><td>5</td>
                    </tr>
                    <tr>
                      <td>ok</td><td>5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <div>
                  Hedge Words
                  <hr/>
                </div>
                <div class="overview-subtext">
                  Hedge words make your statements less impactful. For example “I think we should do
                  this…” is less impactful than “We should do this”. You can use them intentionally
                  but be mindful if you overuse them.
                </div>
                <table>
                  <thead></thead>
                  <tbody>
                    <tr>
                      <td>I guess</td><td>32</td>
                    </tr>
                    <tr>
                      <td>I suppose</td><td>11</td>
                    </tr>
                    <tr>
                      <td>kind of</td><td>6</td>
                    </tr>
                    <tr>
                      <td>or something</td><td>5</td>
                    </tr>
                    <tr>
                      <td>I just</td><td>5</td>
                    </tr>
                    <tr>
                      <td>well...</td><td>5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div/>

          <div class="footer">
            You can find all expressions and terms in your&nbsp;
            <a href="#">personal dashboard</a>.
          </div>
        </div>
      </div>
    </div>;
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
            label: 'Total',
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
