import { initAggregateStats } from '../elo-types/AggregateStats';
import decode from '../elo-types/decode';
import SessionStats from '../elo-types/SessionStats';
import accumulateStats from './accumulateStats';
import AccountRoot from './storage/AccountRoot';
import StorageView from './storage/StorageView';

export default async function mergeAccountRoots(
  storageView: StorageView,
  preferredAccountRoot: AccountRoot,
  secondaryAccountRoot: AccountRoot,
) {
  const result = { ...preferredAccountRoot };

  const { lastSessionKey, aggregateStats } = await mergeSessionHistories(
    storageView,
    preferredAccountRoot,
    secondaryAccountRoot,
  );

  result.lastSessionKey = lastSessionKey;
  result.aggregateStats = aggregateStats;

  return result;
}

async function mergeSessionHistories(
  storageView: StorageView,
  preferredAccountRoot: AccountRoot,
  secondaryAccountRoot: AccountRoot,
) {
  const allSessions: [string, SessionStats][] = [];

  const data = await storageView.rawStorageView.get();

  for (const key of Object.keys(data)) {
    if (!isSession(data[key])) {
      continue;
    }

    const session = decode(SessionStats, data[key]);

    if (
      session.userId === preferredAccountRoot.userId ||
      session.userId === secondaryAccountRoot.userId
    ) {
      allSessions.push([key, session]);
    }
  }

  // Sort by start time descending (recently started first)
  allSessions.sort((a, b) => b[1].start - a[1].start);

  for (let i = 0; i < allSessions.length; i++) {
    const [key, session] = allSessions[i];
    const lastSessionKey = allSessions[i + 1]?.[0];

    if (session.lastSessionKey !== lastSessionKey) {
      session.lastSessionKey = lastSessionKey;
      storageView.write(SessionStats, key, session);
    }
  }

  const lastSessionKey = allSessions[0]?.[0];

  const aggregateStats = initAggregateStats();

  for (let i = 1; i < allSessions.length; i++) {
    accumulateStats(aggregateStats, allSessions[i][1]);
  }

  return { lastSessionKey, aggregateStats };
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
