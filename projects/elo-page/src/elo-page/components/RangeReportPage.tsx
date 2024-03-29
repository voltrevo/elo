import * as React from 'react';

import nil from '../../common-pure/nil';
import { useEloPageContext } from '../EloPageContext';

const RangeReportPage: React.FunctionComponent = () => {
  const rangeReport = useEloPageContext(state => state.rangeReport);

  if (rangeReport === nil) {
    return <>Missing range report</>;
  }

  const { fromDate, toDate, stats } = rangeReport;

  function render() {
    return <div className="elo-page-container">
      <div className="sections">
        <div className="heading">
          <div>
            <div className="your-weekly-report">Range Report</div>
            <div>{fromDate.toDateString()} - {toDate.toDateString()}</div>
            <div className="stats">
              <table>
                <thead></thead>
                <tbody>
                  <tr>
                    <td>Speaking Time</td>
                    <td className="important-value numeric">
                      {Math.round(stats.speakingTime / 60)}
                    </td>
                    <td>min</td>
                  </tr>
                  <tr>
                    <td>Total Time</td>
                    <td className="important-value numeric">
                      {Math.round(stats.audioTime / 60)}
                    </td>
                    <td>min</td>
                  </tr>
                  <tr>
                    <td>Sessions</td>
                    <td className="important-value numeric">
                      {stats.sessionCount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div />
        </div>

        <div className="single-stat-boxes">
          <div className="card">
            <div className="bold">Total</div>
            <div>
              <span className="very-prominent-number third-accent-fgcolor">
                {TotalDisfluentsPerMinute().toFixed(1)}
              </span>
              <span className="bold">&nbsp;per minute speaking</span>
            </div>
            <div>
              {PerMinuteComment()}The optimum frequency is
              one filler per minute, but the average speaker uses five fillers per minute
              (<a href="https://hbr.org/2018/08/how-to-stop-saying-um-ah-and-you-know">source</a>).
              Keep improving with Elo and you’ll get there.
            </div>
          </div>
          <div className="card">
            <div className="bold">Ums &amp; Uhs</div>
            <div>
              <span className="very-prominent-number filler-fgcolor">
                {UmsUhsPerMinute().toFixed(1)}
              </span>
              <span className="bold">&nbsp;per minute speaking</span>
            </div>
            <div>
              Keep paying attention to your ums and uhs till you catch yourself about to use them.
              Then, err on silence instead to develop a smoother, polished delivery.
            </div>
          </div>
          <div className="card">
            <div className="bold">Filler &amp; Hedge Words</div>
            <div>
              <span className="very-prominent-number other-disfluent-fgcolor">
                {FillerWordsPerMinute().toFixed(1)}
              </span>
              <span className="bold">&nbsp;per minute speaking</span>
            </div>
            <div>
              Your most used filler word was
              “<span className="bold other-disfluent-fgcolor">{MostUsedFillerWord()}</span>”.
              <p>
                By eliminating fillers and hedge words you boost your credibility by speaking with
                authority and conviction.
              </p>
            </div>
          </div>
        </div>

        <div className="overview">
          <div className="bold other-disfluent-fgcolor">Overview</div>
          <hr className="overview-underline" />
          <div className="overview-sections">
            <div>
              <div>
                Expressions to Avoid
                <hr/>
              </div>
              <div className="overview-subtext">
                Tip: You can select which expressions Elo looks out for by clicking on the
                dropdown in a video conference.
              </div>
              {renderAvoidsTable()}
            </div>
            <div>
              <div>
                Hedge Words
                <hr/>
              </div>
              <div className="overview-subtext">
                Hedge words make your statements less impactful. For example “I think we should do
                this…” is less impactful than “We should do this”. You can use them intentionally
                but be mindful if you overuse them.
              </div>
              {renderHedgeTable()}
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  function TotalDisfluentsPerMinute() {
    let sum = 0;

    for (const countMap of Object.values(stats.featureCounts)) {
      for (const count of Object.values(countMap)) {
        sum += count;
      }
    }

    return (sum / (stats.speakingTime / 60));
  }

  function PerMinuteComment() {
    if (TotalDisfluentsPerMinute() >= 5) {
      return <></>;
    }

    return <><span className="bold third-accent-fgcolor">That’s pretty good!</span> </>;
  }

  function UmsUhsPerMinute() {
    let sum = 0;

    const fillerCountMap = stats.featureCounts.filler ?? {};

    for (const count of Object.values(fillerCountMap)) {
      sum += count;
    }

    return (sum / (stats.speakingTime / 60));
  }

  function FillerWordsPerMinute() {
    let sum = 0;

    for (const [category, countMap] of Object.entries(stats.featureCounts)) {
      if (category === 'filler') {
        continue;
      }

      for (const count of Object.values(countMap)) {
        sum += count;
      }
    }

    return (sum / (stats.speakingTime / 60));
  }

  function MostUsedFillerWord() {
    let mostUsed: string | undefined = undefined;
    let mostUsedCount = 0;

    for (const [category, countMap] of Object.entries(stats.featureCounts)) {
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

  function renderHedgeTable() {
    const hedgeCounts = stats.featureCounts.hedge ?? {};

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

  function renderAvoidsTable() {
    const avoidCounts: Record<string, number> = {};

    for (const [category, countMap] of Object.entries(stats.featureCounts)) {
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

  return render();
};

export default RangeReportPage;
