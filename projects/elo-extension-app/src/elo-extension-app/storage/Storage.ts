import * as io from 'io-ts';

import base58 from '../../common-pure/base58';
import AccountRoot, { initAccountRoot } from './AccountRoot';
import IRawStorage from './IRawStorage';
import StorageRoot, { initStorageRoot } from './StorageRoot';

export const anonymousAccountRootKey = 'elo-user:anonymous';

export function RandomKey() {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return base58.encode(buf);
}

export default class Storage {
  private constructor(public rawStorage: IRawStorage, public rootKey: string) {}

  static async Create(rawStorage: IRawStorage, rootKey: string) {
    const storage = new Storage(rawStorage, rootKey);

    const root = await storage.readRoot();

    if (root.lastSessionKey || root.metricPreference || root.userId) {
      const anonymousAccount = initAccountRoot();

      const accountRootKey = anonymousAccountRootKey;
      anonymousAccount.lastSessionKey = root.lastSessionKey;
      anonymousAccount.metricPreference = root.metricPreference;
      anonymousAccount.userId = root.userId;

      await storage.write(AccountRoot, accountRootKey, anonymousAccount);

      root.lastSessionKey = undefined;
      root.metricPreference = undefined;
      root.userId = undefined;
      root.accountRoot = accountRootKey;

      await storage.writeRoot(root);
    }

    return storage;
  }

  async read<T extends io.Mixed>(type: T, key: string): Promise<io.TypeOf<T> | undefined> {
    const readResult = (await this.rawStorage.get(key))[key];

    if (readResult === undefined) {
      return undefined;
    }

    const decodeResult = type.decode(readResult);

    if ('left' in decodeResult) {
      throw new Error('Storage decode failed');
    }

    return decodeResult.right;
  }

  async write<T extends io.Mixed>(_type: T, key: string, value: io.TypeOf<T>): Promise<void> {
    await this.rawStorage.set({ [key]: value });
  }

  async readRoot(): Promise<StorageRoot> {
    return await this.read(StorageRoot, this.rootKey) ?? initStorageRoot();
  }

  async writeRoot(root: StorageRoot): Promise<void> {
    await this.write(StorageRoot, this.rootKey, root);
  }

  async remove(key: string): Promise<void> {
    await this.rawStorage.remove(key);
  }
}
