import IRawDeviceStorage from './IRawDeviceStorage';

export default class RawDeviceStorageView {
  callClear = false;
  newItems: Record<string, any> = {};

  constructor(public rawStorage: IRawDeviceStorage) {}

  async get(key?: string): Promise<Record<string, any>> {
    let result: Record<string, any> = {};

    if (this.callClear) {
      if (key === undefined) {
        result = JSON.parse(JSON.stringify(this.newItems));
      } else if (key in this.newItems && this.newItems[key] !== undefined) {
        result[key] = JSON.parse(JSON.stringify(this.newItems[key]));
      }

      return result;
    }

    if (key === undefined) {
      result = await this.rawStorage.get();

      for (const k of Object.keys(this.newItems)) {
        if (this.newItems[k] === undefined) {
          delete result[k];
        } else {
          result[k] = JSON.parse(JSON.stringify(this.newItems[k]));
        }
      }

      return result;
    }

    if (key in this.newItems) {
      if (this.newItems[key] !== undefined) {
        result[key] = JSON.parse(JSON.stringify(this.newItems[key]));
      }
    } else {
      result = await this.rawStorage.get(key);
    }

    return result;
  }

  set(items: Record<string, any>): void {
    this.newItems = {
      ...this.newItems,
      ...JSON.parse(JSON.stringify(items)),
    };
  }

  remove(keys: string[]): void {
    for (const k of keys) {
      this.newItems[k] = undefined;
    }
  }

  clear() {
    this.callClear = true;
    this.newItems = {};
  }

  async commit() {
    if (this.callClear) {
      await this.rawStorage.clear();
    }

    await this.rawStorage.set(this.newItems);

    await this.rawStorage.remove(
      Object.keys(this.newItems).filter(k => this.newItems[k] === undefined)
    );

    this.callClear = false;
    this.newItems = {};
  }
}
