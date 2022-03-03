import * as io from 'io-ts';

import Range from '../../common-pure/Range';
import IRawStorage from './IRawStorage';
import StorageRoot, { initStorageRoot } from './StorageRoot';

export function RandomKey() {
  return Range(64).map(() => Math.floor(16 * Math.random()).toString(16)).join('');
}

export default class Storage {
  constructor(public rawStorage: IRawStorage, public rootKey: string) {}

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
}
