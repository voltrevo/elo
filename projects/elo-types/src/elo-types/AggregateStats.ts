import * as io from 'io-ts';

const AggregateStats = io.type({
  sessionCount: io.number,
  speakingTime: io.number,
  audioTime: io.number,
  featureCounts: io.record(io.string, io.record(io.string, io.number)),
});

type AggregateStats = io.TypeOf<typeof AggregateStats>;

export function initAggregateStats(): AggregateStats {
  return {
    sessionCount: 0,
    speakingTime: 0,
    audioTime: 0,
    featureCounts: {},
  };
}

export default AggregateStats;
