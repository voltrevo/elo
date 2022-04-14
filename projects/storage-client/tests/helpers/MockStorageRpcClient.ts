import base58 from "../../src/common-pure/base58";
import delay from "../../src/common-pure/delay";
import nil from "../../src/common-pure/nil";
import { StorageProtocolInput, StorageProtocolOutput } from "../../src/elo-types/StorageProtocol";
import { IStorageRpcClient } from "../../src/storage-client/StorageRpcClient";

export default class MockStorageRpcClient implements IStorageRpcClient {
  data: Record<string, Record<string, string>> = {};
  queryLimit = 5;

  async get({ collectionId, elementId }: StorageProtocolInput<'get'>): Promise<StorageProtocolOutput<'get'>> {
    await delay(0);

    const element = this.data[collectionId]?.[elementId];

    if (element === nil) {
      return { element: nil };
    }

    return { element: new Uint8Array(base58.decode(element)) };
  }

  _set({ collectionId, elementId, element }: StorageProtocolInput<'set'>) {
    this.data[collectionId] = this.data[collectionId] ?? {};

    const collection = this.data[collectionId];

    if (element === nil) {
      delete collection[elementId];
    } else {
      collection[elementId] = base58.encode(element);
    }
  }

  async set({ collectionId, elementId, element }: StorageProtocolInput<'set'>): Promise<StorageProtocolOutput<'set'>> {
    await delay(0);
    this._set({ collectionId, elementId, element });
    return {};
  }

  async setMulti({ commands }: StorageProtocolInput<'setMulti'>): Promise<StorageProtocolOutput<'setMulti'>> {
    await delay(0);

    for (const command of commands) {
      this._set(command);
    }

    return {};
  }

  async getRange({ collectionId, minElementId, maxElementId }: StorageProtocolInput<'getRange'>): Promise<StorageProtocolOutput<'getRange'>> {
    await delay(0);

    this.data[collectionId] = this.data[collectionId] ?? {};
    const collection = this.data[collectionId];

    const fullResult: StorageProtocolOutput<'getRange'> = {
      entries: Object.entries(collection)
        .filter(([id]) => (
          (minElementId === nil || minElementId <= id) &&
          (maxElementId === nil || id < maxElementId)
        ))
        .map(([id, element]) => {
          return [id, new Uint8Array(base58.decode(element))];
        }),
      nextElementId: nil,
    };

    return {
      entries: fullResult.entries.slice(0, this.queryLimit),
      nextElementId: fullResult.entries[this.queryLimit]?.[0],
    }
  }

  async count({ collectionId }: StorageProtocolInput<'count'>): Promise<StorageProtocolOutput<'count'>> {
    this.data[collectionId] = this.data[collectionId] ?? {};
    const collection = this.data[collectionId];

    return {
      count: Object.keys(collection).length,
    };
  }

  async UsageInfo() {
    return {
      used: 0,
      capacity: 1,
      unit: '',
    };
  }
}
