import * as io from 'io-ts';

import base58 from '../../common-pure/base58';
import IRawStorage from './IRawStorage';
import runMigrations from './migrations/runMigrations';
import StorageRoot, { initStorageRoot } from './StorageRoot';

export const anonymousAccountRootKey = 'elo-user:anonymous';

export function RandomKey() {
  const buf = new Uint8Array(24);
  crypto.getRandomValues(buf);
  return base58.encode(buf);
}

export default class Storage {
  private constructor(public rawStorage: IRawStorage, public rootKey: string) {}

  static async Create(rawStorage: IRawStorage, rootKey: string) {
    await runMigrations(rawStorage)
    return new Storage(rawStorage, rootKey);
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

  async remove(keys: string[]): Promise<void> {
    await this.rawStorage.remove(keys);
  }
}
