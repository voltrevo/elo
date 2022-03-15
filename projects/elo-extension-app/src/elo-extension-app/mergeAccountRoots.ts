import SessionStats from '../elo-types/SessionStats';
import AccountRoot from './storage/AccountRoot';
import Storage from './storage/Storage';

export default async function mergeAccountRoots(
  storage: Storage,
  preferredAccountRoot: AccountRoot,
  secondaryAccountRoot: AccountRoot,
) {
  const result = { ...preferredAccountRoot };

  result.lastSessionKey = await joinSessionHistories(
    storage,
    preferredAccountRoot.lastSessionKey,
    secondaryAccountRoot.lastSessionKey,
  );

  return result;
}

async function joinSessionHistories(
  storage: Storage,
  sessionKeyA: string | undefined,
  sessionKeyB: string | undefined,
) {
  if (sessionKeyA === undefined || sessionKeyB === undefined) {
    return sessionKeyA ?? sessionKeyB;
  }

  const lastA = await findLastSession(storage, sessionKeyA);
  const lastB = await findLastSession(storage, sessionKeyB);

  // Put the shorter history in front
  const [frontKey, frontHistory, backHistoryKey] = (
    lastB.length <= lastA.length
      ? [sessionKeyB, lastB, sessionKeyA]
      : [sessionKeyA, lastA, sessionKeyB]
  );

  frontHistory.session.lastSessionKey = backHistoryKey;
  storage.write(SessionStats, frontHistory.sessionKey, frontHistory.session);

  return frontKey;
}

async function findLastSession(
  storage: Storage,
  sessionKey: string,
) {
  let length = 0;
  let session: SessionStats | undefined;

  while (true) {
    session = await storage.read(SessionStats, sessionKey);

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
