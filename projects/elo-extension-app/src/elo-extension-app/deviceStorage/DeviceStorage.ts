import * as io from 'io-ts';

import base58 from '../../common-pure/base58';
import IRawDeviceStorage from './IRawDeviceStorage';
import runMigrations from './migrations/runMigrations';
import DeviceStorageRoot, { initStorageRoot } from './DeviceStorageRoot';
import IDeviceStorage from './IDeviceStorage';

export const anonymousAccountRootKey = 'elo-user:anonymous';

export function RandomKey() {
  const buf = new Uint8Array(24);
  crypto.getRandomValues(buf);
  return base58.encode(buf);
}

export default class DeviceStorage implements IDeviceStorage {
  private constructor(public rawStorage: IRawDeviceStorage, public rootKey: string) {}

  static async Create(rawStorage: IRawDeviceStorage, rootKey: string) {
    await runMigrations(rawStorage)
    return new DeviceStorage(rawStorage, rootKey);
  }

  async read<T extends io.Mixed>(type: T, key: string): Promise<io.TypeOf<T> | undefined> {
    const readResult = (await this.rawStorage.get(key))[key];

    if (readResult === undefined) {
      return undefined;
    }

    const decodeResult = type.decode(readResult);

    if ('left' in decodeResult) {
      throw new Error('DeviceStorage decode failed');
    }

    return decodeResult.right;
  }

  async write<T extends io.Mixed>(_type: T, key: string, value: io.TypeOf<T>): Promise<void> {
    await this.rawStorage.set({ [key]: value });
  }

  async readRoot(): Promise<DeviceStorageRoot> {
    return await this.read(DeviceStorageRoot, this.rootKey) ?? initStorageRoot();
  }

  async writeRoot(root: DeviceStorageRoot): Promise<void> {
    await this.write(DeviceStorageRoot, this.rootKey, root);
  }

  async remove(keys: string[]): Promise<void> {
    await this.rawStorage.remove(keys);
  }
}
