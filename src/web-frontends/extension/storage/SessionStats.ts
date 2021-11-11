type SessionStats = {
  lastSessionKey?: string;
  title: string;
  start: number;
  end: number;
  speakingTime: number;
  audioTime: number;
  featureCounts: Record<string, Record<string, number>>;
};

function SessionStats(title: string, time: number): SessionStats {
  return {
    title,
    start: time,
    end: time,
    speakingTime: 0,
    audioTime: 0,
    featureCounts: {},
  };
}

export default SessionStats;
