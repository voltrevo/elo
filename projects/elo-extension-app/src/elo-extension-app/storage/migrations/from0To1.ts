import assert from '../../../common-pure/assert';
import base58 from '../../../common-pure/base58';
import IRawStorage from '../IRawStorage';

const anonymousAccountRootKey = 'elo-user:anonymous';

export default async function from0To1(rawStorage: IRawStorage) {
  const root = (await rawStorage.get('elo'))['elo'];
  const userId = root.userId;
  assert(typeof userId === 'string');
  assert(root.storageVersion === undefined);

  const allItems = await rawStorage.get();
  const newItems: Record<string, any> = {};
  const keysToRemove: string[] = [];

  newItems['elo'] = root;

  root.storageVersion = 1;

  {
    // Move to anonymous account root

    newItems[anonymousAccountRootKey] = {
      lastSessionKey: root.lastSessionKey,
      metricPreference: root.metricPreference,
      userId,
    };

    root.lastSessionKey = undefined;
    root.metricPreference = undefined;
    root.userId = undefined;
    root.accountRoot = anonymousAccountRootKey;
  }

  {
    // Use base58 session keys, add userId, rewrite links

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
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return base58.encode(buf);
}
