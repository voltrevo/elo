import base58 from "../../src/common-pure/base58";
import delay from "../../src/common-pure/delay";
import nil from "../../src/common-pure/nil";
import { IStorageRpcClient } from "../../src/storage-client/StorageRpcClient";

export default class MockStorageRpcClient implements IStorageRpcClient {
  data: Record<string, Record<string, string>> = {};

  async get(collectionId: string, elementId: string): Promise<Uint8Array | nil> {
    await delay(0);

    const value = this.data[collectionId]?.[elementId];

    if (value === nil) {
      return nil;
    }

    return new Uint8Array(base58.decode(value));
  }

  _set(collectionId: string, elementId: string, value: Uint8Array | nil) {
    this.data[collectionId] = this.data[collectionId] ?? {};

    const collection = this.data[collectionId];

    if (value === nil) {
      delete collection[elementId];
    } else {
      collection[elementId] = base58.encode(value);
    }
  }

  async set(collectionId: string, elementId: string, value: Uint8Array | nil): Promise<void> {
    await delay(0);
    this._set(collectionId, elementId, value);
  }

  async setMulti(setCommands: [collectionId: string, elementId: string, value: Uint8Array | nil][]): Promise<void> {
    await delay(0);

    for (const setCommand of setCommands) {
      this._set(...setCommand);
    }
  }

  async getRange(collectionId: string, minElementId: string, maxElementId: string): Promise<[string, Uint8Array][]> {
    await delay(0);

    this.data[collectionId] = this.data[collectionId] ?? {};
    const collection = this.data[collectionId];

    return Object.entries(collection)
      .filter(([key]) => {
        return minElementId <= key && key < maxElementId;
      })
      .map(([key, value]) => {
        return [key, new Uint8Array(base58.decode(value))];
      })
    ;
  }  
}
