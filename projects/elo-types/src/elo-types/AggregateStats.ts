import * as io from 'io-ts';

const AggregateStats = io.type({
  speakingTime: io.number,
  audioTime: io.number,
  featureCounts: io.record(io.string, io.record(io.string, io.number)),
});

type AggregateStats = io.TypeOf<typeof AggregateStats>;

export function initAggregateStats(): AggregateStats {
  return {
    speakingTime: 0,
    audioTime: 0,
    featureCounts: {},
  };
}

export default AggregateStats;
