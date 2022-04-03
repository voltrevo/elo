import * as io from 'io-ts';

import Storage from './Storage';
import RawStorageView from "./RawStorageView";
import StorageRoot, { initStorageRoot } from './StorageRoot';

export default class StorageView {
  rootKey: string;
  rawStorageView: RawStorageView;

  constructor(storage: Storage) {
    this.rootKey = storage.rootKey;
    this.rawStorageView = new RawStorageView(storage.rawStorage);
  }

  async read<T extends io.Mixed>(type: T, key: string): Promise<io.TypeOf<T> | undefined> {
    const readResult = (await this.rawStorageView.get(key))[key];

    if (readResult === undefined) {
      return undefined;
    }

    const decodeResult = type.decode(readResult);

    if ('left' in decodeResult) {
      throw new Error('Storage decode failed');
    }

    return decodeResult.right;
  }

  write<T extends io.Mixed>(_type: T, key: string, value: io.TypeOf<T>): void {
    this.rawStorageView.set({ [key]: value });
  }

  async readRoot(): Promise<StorageRoot> {
    return await this.read(StorageRoot, this.rootKey) ?? initStorageRoot();
  }

  writeRoot(root: StorageRoot): void {
    this.write(StorageRoot, this.rootKey, root);
  }

  remove(keys: string[]): void {
    this.rawStorageView.remove(keys);
  }

  async commit() {
    await this.rawStorageView.commit();
  }
}
