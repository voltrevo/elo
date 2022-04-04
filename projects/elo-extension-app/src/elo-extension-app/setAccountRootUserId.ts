import StorageView from '../elo-extension-app/storage/StorageView';
import AccountRoot from '../elo-extension-app/storage/AccountRoot';
import decode from '../elo-types/decode';
import SessionStats from '../elo-types/SessionStats';

export default async function setAccountRootUserId(
  storageView: StorageView,
  accountRoot: AccountRoot,
  newUserId: string,
) {
  if (accountRoot.userId === newUserId) {
    return;
  }

  const data = await storageView.rawStorageView.get();

  for (const key of Object.keys(data)) {
    if (!isSession(data[key])) {
      continue;
    }

    const session = decode(SessionStats, data[key]);

    if (session.userId === accountRoot.userId) {
      session.userId = newUserId;
      storageView.write(SessionStats, key, session);
    }
  }

  accountRoot.userId = newUserId;
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
