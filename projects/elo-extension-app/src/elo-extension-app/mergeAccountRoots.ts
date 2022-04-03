import decode from '../elo-types/decode';
import SessionStats from '../elo-types/SessionStats';
import AccountRoot from './storage/AccountRoot';
import StorageView from './storage/StorageView';

export default async function mergeAccountRoots(
  storageView: StorageView,
  preferredAccountRoot: AccountRoot,
  secondaryAccountRoot: AccountRoot,
) {
  const result = { ...preferredAccountRoot };

  // TODO: Add aggregate stats merge
  result.lastSessionKey = await mergeSessionHistories(
    storageView,
    preferredAccountRoot,
    secondaryAccountRoot,
  );

  return result;
}

async function mergeSessionHistories(
  storageView: StorageView,
  preferredAccountRoot: AccountRoot,
  secondaryAccountRoot: AccountRoot,
): Promise<string | undefined> {
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

  return allSessions[0]?.[0];
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
