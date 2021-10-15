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
    </div>;
  }

  renderHours(durationMs: number) {
    this;
    return `${(durationMs / 3600000).toFixed(1)} hours`;
  }
}
