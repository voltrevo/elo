import DeviceStorageView from './deviceStorage/DeviceStorageView';
import AccountRoot from './deviceStorage/AccountRoot';
import decode from '../elo-types/decode';
import SessionStats from '../elo-types/SessionStats';

export default async function setAccountRootUserId(
  storageView: DeviceStorageView,
  accountRoot: AccountRoot,
  newUserId: string,
) {
  if (accountRoot.userId === newUserId) {
    return;
  }

  const data = await storageView.rawDeviceStorageView.get();

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
