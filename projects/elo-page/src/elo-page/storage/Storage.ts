import Range from '../../common-pure/Range';
import IRawStorage from './IRawStorage';
import StorageRoot from './StorageRoot';

export function RandomKey() {
  return Range(64).map(() => Math.floor(16 * Math.random()).toString(16)).join('');
}

export default class Storage {
  constructor(public rawStorage: IRawStorage, public rootKey: string) {}

  async read<T>(key: string): Promise<T | undefined> {
    return (await this.rawStorage.get(key))[key];
  }

  async write<T>(key: string, value: T): Promise<void> {
    await this.rawStorage.set({ [key]: value });
  }

  async readRoot(): Promise<StorageRoot> {
    return await this.read<StorageRoot>(this.rootKey) ?? StorageRoot();
  }

  async writeRoot(root: StorageRoot): Promise<void> {
    await this.write<StorageRoot>(this.rootKey, root);
  }
}
