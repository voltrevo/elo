import * as preact from 'preact';

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

export default class Page extends preact.Component {
  render() {
    this;
    return <div class="elo-page">
      <div class="elo-page-container">
        <img src="/assets/icons/icon128.png" width="64" height="64" />

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
          <div>Combined</div>
          <div>ums and uhs</div>
          <div>Filler and Hedge Words</div>
        </div>

        <h1>Elo</h1>

        <div class="highlight-stat-container">
          <div class="highlight-stat">
            <div class="value">{(sampleData.totalDuration / 3600000).toFixed(1)}</div>
            <div class="name">Hours Analyzed</div>
          </div>
          <div class="highlight-stat">
            <div class="value">{sampleData.totalSessions}</div>
            <div class="name">Sessions</div>
          </div>
        </div>

        <div>
          <h2>Recent Activity</h2>


        </div>
      </div>
    </div>;
  }

  renderHours(durationMs: number) {
    this;
    return `${(durationMs / 3600000).toFixed(1)} hours`;
  }
}
