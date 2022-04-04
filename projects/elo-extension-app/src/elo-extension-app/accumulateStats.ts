import AggregateStats from '../elo-types/AggregateStats';
import SessionStats from '../elo-types/SessionStats';

export default function accumulateStats(aggregateStats: AggregateStats, sessionStats: SessionStats) {
  aggregateStats.sessionCount += 1;
  aggregateStats.audioTime += sessionStats.audioTime;
  aggregateStats.speakingTime += sessionStats.speakingTime;
  
  for (const category of Object.keys(sessionStats.featureCounts)) {
    aggregateStats.featureCounts[category] = aggregateStats.featureCounts[category] ?? {};
    const aggCategory = aggregateStats.featureCounts[category];

    for (const name of Object.keys(sessionStats.featureCounts[category])) {
      aggCategory[name] = (aggCategory[name] ?? 0) + sessionStats.featureCounts[category][name];
    }
  }
}
