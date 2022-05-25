import * as io from 'io-ts';

import DeviceStorage from './DeviceStorage';
import RawDeviceStorageView from "./RawDeviceStorageView";
import DeviceStorageRoot, { initStorageRoot } from './DeviceStorageRoot';
import IDeviceStorage from './IDeviceStorage';

export default class DeviceStorageView implements IDeviceStorage {
  rootKey: string;
  rawDeviceStorageView: RawDeviceStorageView;

  constructor(deviceStorage: DeviceStorage) {
    this.rootKey = deviceStorage.rootKey;
    this.rawDeviceStorageView = new RawDeviceStorageView(deviceStorage.rawStorage);
  }

  async read<T extends io.Mixed>(type: T, key: string): Promise<io.TypeOf<T> | undefined> {
    const readResult = (await this.rawDeviceStorageView.get(key))[key];

    if (readResult === undefined) {
      return undefined;
    }

    const decodeResult = type.decode(readResult);

    if ('left' in decodeResult) {
      throw new Error('DeviceStorage decode failed');
    }

    return decodeResult.right;
  }

  async write<T extends io.Mixed>(_type: T, key: string, value: io.TypeOf<T>) {
    this.rawDeviceStorageView.set({ [key]: value });
  }

  async readRoot(): Promise<DeviceStorageRoot> {
    return await this.read(DeviceStorageRoot, this.rootKey) ?? initStorageRoot();
  }

  async writeRoot(root: DeviceStorageRoot) {
    this.write(DeviceStorageRoot, this.rootKey, root);
  }

  async remove(keys: string[]) {
    this.rawDeviceStorageView.remove(keys);
  }

  async commit() {
    await this.rawDeviceStorageView.commit();
  }
}
