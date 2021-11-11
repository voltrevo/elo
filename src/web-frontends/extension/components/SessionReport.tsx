import * as preact from 'preact';

import Storage from '../storage/Storage';
import SessionStats from '../storage/SessionStats';
import { stringify } from 'querystring';

const storage = new Storage('elo');

type Props = {
  lastSession: SessionStats;
};

export default class SessionReport extends preact.Component<Props> {
  render() {
    const { lastSession } = this.props;

    return <div class="elo-page">
      <div class="elo-page-container">
        <img src="/assets/icons/icon128.png" width="64" height="64" />

        <div class="sections">
          <div/>
          <div class="heading">
            <div>
              <div class="your-weekly-report">Session Report</div>
              <div>{this.renderSessionDateTime()}</div>
              <div class="stats">
                <table>
                  <thead></thead>
                  <tbody>
                    <tr>
                      <td>Speaking Time</td>
                      <td class="important-value numeric">
                        {Math.round(lastSession.speakingTime / 60)}
                      </td>
                      <td>min</td>
                    </tr>
                    <tr>
                      <td>Total Time</td>
                      <td class="important-value numeric">
                        {Math.round(lastSession.audioTime / 60)}
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
                  {this.renderTotalDisfluentsPerMinute()}
                </span>
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
                <span class="very-prominent-number filler-fgcolor">
                  {this.renderUmsUhsPerMinute()}
                </span>
                <span class="bold">&nbsp;per minute speaking</span>
              </div>
              <div>
                Keep paying attention to your ehms and uhms till you catch yourself about to use them.
                Then, err on silence instead to develop a smoother, polished delivery.
              </div>
            </div>
            <div class="card">
              <div class="bold">Filler &amp; Hedge Words</div>
              <div>
                <span class="very-prominent-number other-disfluent-fgcolor">
                  {this.renderFillerWordsPerMinute()}
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
        </div>
      </div>
    </div>;
  }

  renderSessionDateTime() {
    const { lastSession } = this.props;

    const daysDiff = LocalDaysDifference(lastSession.end, lastSession.start);

    return [
      `${new Date(lastSession.start).toDateString()},`,
      `${TimeOfDayStr(lastSession.start)} - ${TimeOfDayStr(lastSession.end)}`,
      ...(daysDiff > 0 ? [`(+${daysDiff}d)`] : []),
    ].join(' ');
  }

  renderTotalDisfluentsPerMinute() {
    const { lastSession } = this.props;

    let sum = 0;

    for (const countMap of Object.values(lastSession.featureCounts)) {
      for (const count of Object.values(countMap)) {
        sum += count;
      }
    }
    
    return (sum / lastSession.speakingTime).toFixed(1);
  }

  renderUmsUhsPerMinute() {
    const { lastSession } = this.props;

    let sum = 0;

    const fillerCountMap = lastSession.featureCounts.filler ?? {};

    for (const count of Object.values(fillerCountMap)) {
      sum += count;
    }

    return (sum / lastSession.speakingTime).toFixed(1);
  }

  renderFillerWordsPerMinute() {
    const { lastSession } = this.props;

    let sum = 0;

    for (const [category, countMap] of Object.entries(lastSession.featureCounts)) {
      if (category === 'filler') {
        continue;
      }

      for (const count of Object.values(countMap)) {
        sum += count;
      }
    }
    
    return (sum / lastSession.speakingTime).toFixed(1);
  }

  MostUsedFillerWord() {
    const { lastSession } = this.props;

    let mostUsed: string | undefined = undefined;
    let mostUsedCount = 0;

    for (const [category, countMap] of Object.entries(lastSession.featureCounts)) {
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
}

function TimeOfDayStr(unixTimeMs: number) {
  const date = new Date(unixTimeMs);

  const amPm = date.getHours() < 12 ? 'am' : 'pm';

  return `${date.getHours() % 12}:${date.getMinutes().toString().padStart(2, '0')}${amPm}`;
}

function LocalDaysDifference(a: number, b: number) {
  const aDate = new Date(a);
  const bDate = new Date(b);

  aDate.setHours(0);
  bDate.setHours(0);

  return Math.round((aDate.getTime() - bDate.getTime()) / 86_400_000);
}
