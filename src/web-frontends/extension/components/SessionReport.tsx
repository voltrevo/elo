import * as preact from 'preact';

import Storage from '../storage/Storage';
import SessionStats from '../storage/SessionStats';

type Props = {
  lastSession: SessionStats;
  storage: Storage;
};

type State = {
  session: SessionStats;
};

export default class SessionReport extends preact.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = { session: props.lastSession };
  }

  render() {
    const { session } = this.state;

    return <div class="elo-page">
      <div class="elo-page-container">
        <img src="/assets/icons/icon128.png" width="64" height="64" />

        <div class="sections">
          <div/>
          {this.renderPreviousLink()}
          <div class="heading">
            <div>
              <div class="your-weekly-report">Session Report</div>
              <div>{session.title}</div>
              <div>{this.SessionDateTime()}</div>
              <div class="stats">
                <table>
                  <thead></thead>
                  <tbody>
                    <tr>
                      <td>Speaking Time</td>
                      <td class="important-value numeric">
                        {Math.round(session.speakingTime / 60)}
                      </td>
                      <td>min</td>
                    </tr>
                    <tr>
                      <td>Total Time</td>
                      <td class="important-value numeric">
                        {Math.round(session.audioTime / 60)}
                      </td>
                      <td>min</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              {/* <div class="user-label">User</div>
              <div class="user-proper-name">(Enter username?)</div> */}
            </div>
          </div>

          <div class="single-stat-boxes">
            <div class="card">
              <div class="bold">Total</div>
              <div>
                <span class="very-prominent-number third-accent-fgcolor">
                  {this.TotalDisfluentsPerMinute().toFixed(1)}
                </span>
                <span class="bold">&nbsp;per minute speaking</span>
              </div>
              <div>
                {this.PerMinuteComment()}The optimum frequency is
                one filler per minute, but the average speaker uses five fillers per minute
                (<a href="https://hbr.org/2018/08/how-to-stop-saying-um-ah-and-you-know">source</a>).
                Keep improving with Elo and you’ll get there.
              </div>
            </div>
            <div class="card">
              <div class="bold">Ums &amp; Uhs</div>
              <div>
                <span class="very-prominent-number filler-fgcolor">
                  {this.UmsUhsPerMinute().toFixed(1)}
                </span>
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
                <span class="very-prominent-number other-disfluent-fgcolor">
                  {this.FillerWordsPerMinute().toFixed(1)}
                </span>
                <span class="bold">&nbsp;per minute speaking</span>
              </div>
              <div>
                Your most used filler word was
                “<span class="bold other-disfluent-fgcolor">{this.MostUsedFillerWord()}</span>”.
                <p>
                  By eliminating fillers and hedge words you boost your credibility by speaking with
                  authority and conviction.
                </p>
              </div>
            </div>
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
                {this.renderAvoidsTable()}
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
                {this.renderHedgeTable()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  SessionDateTime() {
    const { session } = this.state;

    const daysDiff = LocalDaysDifference(session.end, session.start);

    return [
      `${new Date(session.start).toDateString()},`,
      `${TimeOfDayStr(session.start)} - ${TimeOfDayStr(session.end)}`,
      ...(daysDiff > 0 ? [`(+${daysDiff}d)`] : []),
    ].join(' ');
  }

  TotalDisfluentsPerMinute() {
    const { session } = this.state;

    let sum = 0;

    for (const countMap of Object.values(session.featureCounts)) {
      for (const count of Object.values(countMap)) {
        sum += count;
      }
    }
    
    return (sum / (session.speakingTime / 60));
  }

  UmsUhsPerMinute() {
    const { session } = this.state;

    let sum = 0;

    const fillerCountMap = session.featureCounts.filler ?? {};

    for (const count of Object.values(fillerCountMap)) {
      sum += count;
    }

    return (sum / (session.speakingTime / 60));
  }

  FillerWordsPerMinute() {
    const { session } = this.state;

    let sum = 0;

    for (const [category, countMap] of Object.entries(session.featureCounts)) {
      if (category === 'filler') {
        continue;
      }

      for (const count of Object.values(countMap)) {
        sum += count;
      }
    }
    
    return (sum / (session.speakingTime / 60));
  }

  MostUsedFillerWord() {
    const { session } = this.state;

    let mostUsed: string | undefined = undefined;
    let mostUsedCount = 0;

    for (const [category, countMap] of Object.entries(session.featureCounts)) {
      if (category === 'filler') {
        continue;
      }

      for (const [word, count] of Object.entries(countMap)) {
        if (count > mostUsedCount) {
          mostUsed = word;
          mostUsedCount = count;
        }
      }
    }

    return mostUsed;
  }

  renderHedgeTable() {
    const { session } = this.state;

    const hedgeCounts = session.featureCounts.hedge ?? {};

    return <table>
      <thead></thead>
      <tbody>
        {Object.entries(hedgeCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([expression, count]) => (
            <tr>
              <td>{expression}</td>
              <td>{count}</td>
            </tr>
          ))
        }
      </tbody>
    </table>;
  }

  renderAvoidsTable() {
    const { session } = this.state;

    const avoidCounts: Record<string, number> = {};

    for (const [category, countMap] of Object.entries(session.featureCounts)) {
      if (['filler', 'hedge'].includes(category)) {
        continue;
      }

      for (const [expression, count] of Object.entries(countMap)) {
        avoidCounts[expression] = count;
      }
    }

    return <table>
      <thead></thead>
      <tbody>
        {Object.entries(avoidCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([expression, count]) => (
            <tr>
              <td>{expression}</td>
              <td>{count}</td>
            </tr>
          ))
        }
      </tbody>
    </table>;
  }

  PerMinuteComment() {
    if (this.TotalDisfluentsPerMinute() >= 5) {
      return <></>;
    }

    return <><span class="bold third-accent-fgcolor">That’s pretty good!</span> </>;
  }

  renderPreviousLink() {
    const { session } = this.state;

    if (session.lastSessionKey === undefined) {
      return <></>;
    }

    return <div>
      <a href="#" onClick={() => this.loadPreviousSession()}>
        ⬅ Previous
      </a>
    </div>;
  }

  async loadPreviousSession() {
    const { session } = this.state;

    if (session.lastSessionKey === undefined) {
      return;
    }

    const lastSession = await this.props.storage.read<SessionStats>(session.lastSessionKey);

    if (lastSession === undefined) {
      return;
    }

    this.setState({ session: lastSession });
  }
}

function TimeOfDayStr(unixTimeMs: number) {
  const date = new Date(unixTimeMs);

  const amPm = date.getHours() < 12 ? 'am' : 'pm';

  let displayHour = date.getHours() % 12;

  if (displayHour === 0) {
    displayHour = 12;
  }

  return `${displayHour}:${date.getMinutes().toString().padStart(2, '0')}${amPm}`;
}

function LocalDaysDifference(a: number, b: number) {
  const aDate = new Date(a);
  const bDate = new Date(b);

  aDate.setHours(0);
  bDate.setHours(0);

  return Math.round((aDate.getTime() - bDate.getTime()) / 86_400_000);
}
