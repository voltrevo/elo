import { keccak256 } from 'js-sha3';
import assert from '../../../common-pure/assert';
import base58 from '../../../common-pure/base58';
import IRawStorage from '../IRawStorage';

export default async function from0To1(rawStorage: IRawStorage) {
  const root = await rawStorage.get('elo');
  const userId = root.userId;
  assert(typeof userId === 'string');
  assert(root.storageVersion === undefined);

  const allItems = await rawStorage.get();
  const newItems: Record<string, any> = {};
  const keysToRemove: string[] = [];

  root.storageVersion = 1;
  newItems['elo'] = root;

  const allSessions: [string, any][] = [];

  for (const k of Object.keys(allItems)) {
    const value = allItems[k];

    if (isSession(value) && value.userId === undefined) {
      value.userId = userId;
      const newKey = RandomKey();
      newItems[newKey] = value;
      keysToRemove.push(k);
      allSessions.push([k, value]);
    }
  }

  allSessions.sort((a, b) => b[1].start - a[1].start);

  for (let i = 0; i < allSessions.length - 1; i++) {
    const [, session] = allSessions[i];
    const [lastSessionKey] = allSessions[i + 1];

    session.lastSessionKey = lastSessionKey;
  }

  for (let i = 0; i < allSessions.length; i++) {
    const [k, session] = allSessions[i];
    session.index = i;

    if (i % 8 === 0) {
      newItems[keySequence(userId, 'session-checkpoints', i)] = { key: k };
    }
  }

  await rawStorage.set(newItems);

  for (const k of keysToRemove) {
    await rawStorage.remove(k);
  }
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

function keySequence(userId: string, sequenceName: string, index: number) {
  const hashInput = JSON.stringify([userId, sequenceName, index]);
  
  const buf = new Uint8Array(
    keccak256.update(hashInput).arrayBuffer()
  );
  
  return base58.encode(buf);
}
