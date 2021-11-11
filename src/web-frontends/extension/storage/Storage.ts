import browser from "webextension-polyfill";
import Range from "../../helpers/Range";
import SessionStats from "./SessionStats";
import StorageRoot from "./StorageRoot";

export function RandomKey() {
  return Range(64).map(() => Math.floor(16 * Math.random()).toString(16)).join('');
}

export default class Storage {
  constructor(public rootKey: string) {}

  async read<T>(key: string): Promise<T | undefined> {
    return (await browser.storage.local.get(key))[key];
  }

  async write<T>(key: string, value: T): Promise<void> {
    await browser.storage.local.set({ [key]: value });
  }

  async readRoot(): Promise<StorageRoot> {
    return await this.read<StorageRoot>(this.rootKey) ?? StorageRoot();
  }

  async writeRoot(root: StorageRoot): Promise<void> {
    await this.write<StorageRoot>(this.rootKey, root);
  }
}
