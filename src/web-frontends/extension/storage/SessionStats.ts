type SessionStats = {
  lastSessionKey?: string;
  speakingTime: number;
  totalTime: number;
  featureCounts: Record<string, Record<string, number>>;
};

function SessionStats(): SessionStats {
  return {
    speakingTime: 0,
    totalTime: 0,
    featureCounts: {},
  };
}

export default SessionStats;
