import assert from '../../../common-pure/assert';
import base58 from '../../../common-pure/base58';
import IRawDeviceStorage from '../IRawDeviceStorage';

const anonymousAccountRootKey = 'elo-user:anonymous';

export default async function from0To1(rawStorage: IRawDeviceStorage) {
  const root = (await rawStorage.get('elo'))['elo'];
  const userId = root.userId;
  assert(typeof userId === 'string');
  assert(root.storageVersion === undefined);

  const allItems = await rawStorage.get();
  const newItems: Record<string, any> = {};
  const keysToRemove: string[] = [];

  newItems['elo'] = root;

  root.storageVersion = 1;

  const aggregateStats = {
    sessionCount: 0,
    speakingTime: 0,
    audioTime: 0,
    featureCounts: {},
  };

  {
    // Move to anonymous account root

    newItems[anonymousAccountRootKey] = {
      userId,
      settings: {
        liveStatsMode: root.metricPreference === 'ewma' ? 'recentAverage' : 'count',
      },
      aggregateStats,
      lastSessionKey: root.lastSessionKey,
    };

    root.lastSessionKey = undefined;
    root.metricPreference = undefined;
    root.userId = undefined;
    root.accountRoot = anonymousAccountRootKey;
  }

  {
    // Use base58 session keys, add userId, rewrite links, aggregate stats

    const allSessions: [string, any][] = [];

    for (const k of Object.keys(allItems)) {
      const value = allItems[k];

      if (isSession(value) && value.userId === undefined) {
        value.userId = userId;
        const newKey = RandomKey();
        newItems[newKey] = value;
        keysToRemove.push(k);
        allSessions.push([newKey, value]);
      }
    }

    allSessions.sort((a, b) => b[1].start - a[1].start);

    newItems[root.accountRoot].lastSessionKey = allSessions[0][0];

    for (let i = 0; i < allSessions.length - 1; i++) {
      const [, session] = allSessions[i];
      const [lastSessionKey] = allSessions[i + 1];

      session.lastSessionKey = lastSessionKey;
    }

    for (let i = 1; i < allSessions.length; i++) {
      accumulateStats(aggregateStats, allSessions[i][1]);
    }
  }

  await rawStorage.set(newItems);
  await rawStorage.remove(keysToRemove);
}

function isSession(value: any) {
  const keys = [
    'title',
    'start',
    'end',
    'speakingTime',
  ];

  return keys.every(k => k in value);
}

function RandomKey() {
  const buf = new Uint8Array(24);
  crypto.getRandomValues(buf);
  return base58.encode(buf);
}

function accumulateStats(aggregateStats: any, sessionStats: any) {
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
