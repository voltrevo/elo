import SessionStats from '../elo-types/SessionStats';
import AccountRoot from './storage/AccountRoot';
import StorageView from './storage/StorageView';

export default async function mergeAccountRoots(
  storageView: StorageView,
  preferredAccountRoot: AccountRoot,
  secondaryAccountRoot: AccountRoot,
) {
  const result = { ...preferredAccountRoot };

  // TODO: Do a full sort instead, also add aggregate stats merge
  result.lastSessionKey = await joinSessionHistories(
    storageView,
    preferredAccountRoot.lastSessionKey,
    secondaryAccountRoot.lastSessionKey,
  );

  return result;
}

async function joinSessionHistories(
  storageView: StorageView,
  sessionKeyA: string | undefined,
  sessionKeyB: string | undefined,
) {
  if (sessionKeyA === undefined || sessionKeyB === undefined) {
    return sessionKeyA ?? sessionKeyB;
  }

  const lastA = await findLastSession(storageView, sessionKeyA);
  const lastB = await findLastSession(storageView, sessionKeyB);

  // Put the shorter history in front
  const [frontKey, frontHistory, backHistoryKey] = (
    lastB.length <= lastA.length
      ? [sessionKeyB, lastB, sessionKeyA]
      : [sessionKeyA, lastA, sessionKeyB]
  );

  frontHistory.session.lastSessionKey = backHistoryKey;
  storageView.write(SessionStats, frontHistory.sessionKey, frontHistory.session);

  return frontKey;
}

async function findLastSession(
  storageView: StorageView,
  sessionKey: string,
) {
  let length = 0;
  let session: SessionStats | undefined;

  while (true) {
    session = await storageView.read(SessionStats, sessionKey);

    if (session === undefined) {
      throw new Error(`Failed to find session: ${sessionKey}`);
    }

    length++;

    if (session.lastSessionKey === undefined) {
      return {
        session,
        sessionKey,
        length,
      };
    }

    sessionKey = session.lastSessionKey;
  }
}
