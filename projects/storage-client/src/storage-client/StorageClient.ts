import * as io from 'io-ts';
import msgpack from '@msgpack/msgpack';

import StorageRpcClient from "./StorageRpcClient";
import nil from '../common-pure/nil';
import { decryptWithKeyHash, encryptWithKeyHash, getKeyHash } from './encryption';
import StorageKeyCalculator from './StorageKeyCalculator';
import decode from '../elo-types/decode';
import buffersEqual from '../common-pure/buffersEqual';
import base58 from '../common-pure/base58';
import ObfuscatedTimeId from './ObfuscatedTimeId';

export default class StorageClient {
  constructor(
    public rpcClient: StorageRpcClient,
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
    const encryptedBuf = await this.rpcClient.get(collectionId, elementId);

    if (encryptedBuf === nil) {
      return nil;
    }

    const keyHash = getKeyHash(encryptedBuf);
    const key = await this.keyCalculator.calculateKey(keyHash);
    const buf = decryptWithKeyHash(key, encryptedBuf);

    const untypedValue = msgpack.decode(buf);

    const value = decode(type, untypedValue);

    if (!buffersEqual(key, this.keyCalculator.latestKey)) {
      await this.fullSet(type, collectionId, elementId, value);
    }

    return value;
  }

  async fullGetRange<T extends io.Mixed>(
    type: T,
    collectionId: string,
    minElementId: string,
    maxElementId: string,
  ): Promise<[string, io.TypeOf<T>][]> {
    const encryptedResults = await this.rpcClient.getRange(collectionId, minElementId, maxElementId);

    let results: [string, T][] = [];

    for (const [id, encryptedBuf] of encryptedResults) {
      const keyHash = getKeyHash(encryptedBuf);
      const key = await this.keyCalculator.calculateKey(keyHash);
      const buf = decryptWithKeyHash(key, encryptedBuf);
  
      const untypedValue = msgpack.decode(buf);
  
      const element = decode(type, untypedValue);
  
      if (!buffersEqual(key, this.keyCalculator.latestKey)) {
        await this.fullSet(type, collectionId, id, element);
      }

      results.push([id, element]);
    }

    return results;
  }

  async fullSet<T extends io.Mixed>(_type: T, collectionId: string, elementId: string, value: io.TypeOf<T> | nil) {
    if (value === nil) {
      await this.rpcClient.set(collectionId, elementId, nil);
      return;
    }

    const encryptedBuf = encryptWithKeyHash(this.keyCalculator.latestKey, msgpack.encode(value));
    await this.rpcClient.set(collectionId, elementId, encryptedBuf);
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

  async RangeEntries(minElementId: string, maxElementId: string): Promise<[string, io.TypeOf<T>][]> {
    return await this.client.fullGetRange(
      this.elementType,
      this.collectionId,
      minElementId,
      maxElementId,
    );
  }

  async Range(minElementId: string, maxElementId: string): Promise<io.TypeOf<T>[]> {
    const entries = await this.RangeEntries(minElementId, maxElementId);
    return entries.map(([, element]) => element);
  }
}

export class StorageTimedCollection<T extends io.Mixed> {
  _obfuscationSeed?: string;

  constructor(public collection: StorageCollection<T>) {}

  Element(elementId: string) {
    return this.collection.Element(elementId);
  }

  async RangeEntries(minTime: number, maxTime: number) {
    const obfuscationSeed = await this.ObfuscationSeed();

    return await this.collection.RangeEntries(
      ObfuscatedTimeId(obfuscationSeed, minTime, 0n),
      ObfuscatedTimeId(obfuscationSeed, maxTime, 0n),
    );
  }

  async Range(minTime: number, maxTime: number) {
    const entries = await this.RangeEntries(minTime, maxTime);
    return entries.map(([, element]) => element);
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
