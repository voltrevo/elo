import * as io from 'io-ts';
import optional from './optional';

const SessionStats = io.type({
  lastSessionKey: optional(io.string),
  sessionToken: optional(io.string),
  userId: optional(io.string),
  title: io.string,
  start: io.number,
  end: io.number,
  speakingTime: io.number,
  audioTime: io.number,
  featureCounts: io.record(io.string, io.record(io.string, io.number)),
});

type SessionStats = io.TypeOf<typeof SessionStats>;

export function initSessionStats(title: string, time: number): SessionStats {
  return {
    lastSessionKey: undefined,
    sessionToken: undefined,
    title,
    start: time,
    end: time,
    speakingTime: 0,
    audioTime: 0,
    featureCounts: {},
  };
}

export default SessionStats;
