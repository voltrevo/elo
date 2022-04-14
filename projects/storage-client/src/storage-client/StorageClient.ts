import * as io from 'io-ts';
import * as msgpack from '@msgpack/msgpack';

import type { IStorageRpcClient } from "./StorageRpcClient";
import nil from '../common-pure/nil';
import { decryptWithKeyHash, encryptWithKeyHash, getKeyHash } from './encryption';
import StorageKeyCalculator from './StorageKeyCalculator';
import decode from '../elo-types/decode';
import buffersEqual from '../common-pure/buffersEqual';
import base58 from '../common-pure/base58';
import ObfuscatedTimeId from './ObfuscatedTimeId';

export default class StorageClient {
  constructor(
    public rpcClient: IStorageRpcClient,
    public keyCalculator: StorageKeyCalculator,
  ) {}

  Element<T extends io.Mixed>(type: T, elementId: string) {
    return new StorageElement(this, type, 'key-value', elementId);
  }

  Collection<T extends io.Mixed>(elementType: T, collectionId: string) {
    return new StorageCollection(this, elementType, collectionId);
  }

  TimedCollection<T extends io.Mixed>(elementType: T, collectionId: string) {
    return new StorageTimedCollection(this.Collection(elementType, collectionId));
  }

  async fullGet<T extends io.Mixed>(type: T, collectionId: string, elementId: string): Promise<io.TypeOf<T> | nil> {
    const { element: encryptedBuf } = await this.rpcClient.get({ collectionId, elementId });

    if (encryptedBuf === nil) {
      return nil;
    }

    const keyHash = getKeyHash(encryptedBuf);
    const key = await this.keyCalculator.calculateKey(keyHash);
    const buf = decryptWithKeyHash(key, encryptedBuf);

    const untypedElement = msgpack.decode(buf);

    const element = decode(type, untypedElement);

    if (!buffersEqual(key, this.keyCalculator.latestKey)) {
      await this.fullSet(type, collectionId, elementId, element);
    }

    return element;
  }

  async* fullGetRange<T extends io.Mixed>(
    type: T,
    collectionId: string,
    minElementId?: string,
    maxElementId?: string,
  ): AsyncGenerator<[string, io.TypeOf<T>]> {
    let min = minElementId;

    while (true) {
      const { entries: encryptedEntries, nextElementId } = await this.rpcClient.getRange({
        collectionId,
        minElementId: min,
        maxElementId,
      });

      for (const [id, encryptedBuf] of encryptedEntries) {
        const keyHash = getKeyHash(encryptedBuf);
        const key = await this.keyCalculator.calculateKey(keyHash);
        const buf = decryptWithKeyHash(key, encryptedBuf);
    
        const untypedValue = msgpack.decode(buf);
    
        const element = decode(type, untypedValue);
    
        if (!buffersEqual(key, this.keyCalculator.latestKey)) {
          await this.fullSet(type, collectionId, id, element);
        }
  
        yield [id, element];
      }

      if (nextElementId === nil) {
        break;
      }

      min = nextElementId;
    }
  }

  async fullSet<T extends io.Mixed>(_type: T, collectionId: string, elementId: string, element: io.TypeOf<T> | nil) {
    if (element === nil) {
      await this.rpcClient.set({ collectionId, elementId, element });
      return;
    }

    const encryptedBuf = encryptWithKeyHash(this.keyCalculator.latestKey, msgpack.encode(element));
    await this.rpcClient.set({ collectionId, elementId, element: encryptedBuf });
  }
}

export class StorageElement<T extends io.Mixed> {
  constructor(
    public client: StorageClient,
    public type: T,
    public collectionId: string,
    public elementId: string,
  ) {}

  async get(): Promise<io.TypeOf<T> | nil> {
    const value = await this.client.fullGet(this.type, this.collectionId, this.elementId);
    return value;
  }

  async set(value: io.TypeOf<T> | nil): Promise<void> {
    await this.client.fullSet(this.type, this.collectionId, this.elementId, value);
  }
}

export class StorageCollection<T extends io.Mixed> {
  constructor(
    public client: StorageClient,
    public elementType: T,
    public collectionId: string,
  ) {}

  Element(elementId: string): StorageElement<T> {
    return new StorageElement(this.client, this.elementType, this.collectionId, elementId);
  }

  RangeEntries(minElementId?: string, maxElementId?: string): AsyncGenerator<[string, io.TypeOf<T>]> {
    return this.client.fullGetRange(
      this.elementType,
      this.collectionId,
      minElementId,
      maxElementId,
    );
  }

  async* Range(minElementId?: string, maxElementId?: string): AsyncGenerator<io.TypeOf<T>> {
    for await (const [, element] of this.RangeEntries(minElementId, maxElementId)) {
      yield element;
    }
  }
}

export class StorageTimedCollection<T extends io.Mixed> {
  _obfuscationSeed?: string;

  constructor(public collection: StorageCollection<T>) {}

  Element(elementId: string) {
    return this.collection.Element(elementId);
  }

  async* RangeEntries(minTime?: number, maxTime?: number): AsyncGenerator<[string, io.TypeOf<T>]> {
    const obfuscationSeed = await this.ObfuscationSeed();

    for await (const entry of this.collection.RangeEntries(
      minTime === nil ? nil : ObfuscatedTimeId(obfuscationSeed, minTime, 0n),
      maxTime === nil ? nil : ObfuscatedTimeId(obfuscationSeed, maxTime, 0n),
    )) {
      yield entry;
    }
  }

  async* Range(minTime?: number, maxTime?: number): AsyncGenerator<io.TypeOf<T>> {
    for await (const [, element] of this.RangeEntries(minTime, maxTime)) {
      yield element;
    }
  }

  private async ObfuscationSeed() {
    if (this._obfuscationSeed === nil) {
      const seedElement = this.collection.client.Element(
        io.string,
        `${this.collection.collectionId}:obfuscationSeed`,
      );
  
      let obfuscationSeed = await seedElement.get();
  
      if (obfuscationSeed === nil) {
        obfuscationSeed = base58.encode(crypto.getRandomValues(new Uint8Array(32)));
        await seedElement.set(obfuscationSeed);
      }
  
      this._obfuscationSeed = obfuscationSeed;
    }

    return this._obfuscationSeed;
  }
}
