import * as io from 'io-ts';
import * as msgpack from '@msgpack/msgpack';

import type { IStorageRpcClient } from "./StorageRpcClient";
import nil from '../common-pure/nil';
import { decryptWithKeyHash, encryptWithKeyHash, getKeyHash } from './encryption';
import StorageKeyCalculator from './StorageKeyCalculator';
import decode from '../elo-types/decode';
import buffersEqual from '../common-pure/buffersEqual';
import base58 from '../common-pure/base58';
import ObfuscatedTimeId, { TrailValue } from './ObfuscatedTimeId';

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
    direction: 'ascending' | 'descending',
    minElementId?: string,
    maxElementId?: string,
    offsetParam?: number,
  ): AsyncGenerator<[string, io.TypeOf<T>]> {
    let min = minElementId;
    let max = maxElementId;
    let offset = offsetParam;

    while (true) {
      const { entries: encryptedEntries, nextElementId } = await this.rpcClient.getRange({
        collectionId,
        minElementId: min,
        maxElementId: max,
        offset,
        direction,
      });

      for (const [id, encryptedBuf] of encryptedEntries) {
        const keyHash = getKeyHash(encryptedBuf);
        const key = await this.keyCalculator.calculateKey(keyHash);
        const buf = decryptWithKeyHash(key, encryptedBuf);
    
        const untypedElement = msgpack.decode(buf);
    
        const element = decode(type, untypedElement);
    
        if (!buffersEqual(key, this.keyCalculator.latestKey)) {
          await this.fullSet(type, collectionId, id, element);
        }
  
        yield [id, element];
      }

      if (nextElementId === nil) {
        break;
      }

      if (direction === 'ascending') {
        min = nextElementId;
      } else {
        max = nextElementId;
      }

      offset = nil;
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

  async UsageInfo() {
    return await this.rpcClient.UsageInfo({});
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
    const element = await this.client.fullGet(this.type, this.collectionId, this.elementId);
    return element;
  }

  async set(element: io.TypeOf<T> | nil): Promise<void> {
    await this.client.fullSet(this.type, this.collectionId, this.elementId, element);
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

  RangeEntries({
    direction = 'ascending',
    min = nil,
    max = nil,
    offset = nil,
  }: {
    direction?: 'ascending' | 'descending',
    min?: string,
    max?: string,
    offset?: number,
  } = {}): AsyncGenerator<[string, io.TypeOf<T>]> {
    return this.client.fullGetRange(
      this.elementType,
      this.collectionId,
      direction,
      min,
      max,
      offset,
    );
  }

  async* Range({
    direction = 'ascending',
    min = nil,
    max = nil,
    offset = nil,
  } : {
    direction?: 'ascending' | 'descending',
    min?: string,
    max?: string,
    offset?: number,
  } = {}): AsyncGenerator<io.TypeOf<T>> {
    for await (const [, element] of this.RangeEntries({ direction, min, max, offset })) {
      yield element;
    }
  }

  async count(): Promise<number> {
    const {
      count,
    } = await this.client.rpcClient.count({ collectionId: this.collectionId });

    return count;
  }
}

export class StorageTimedCollection<T extends io.Mixed> {
  _obfuscationSeed?: string;
  lastGeneratedTrail = {
    time: -Infinity, 
    trailValue: TrailValue(),
  };

  constructor(public collection: StorageCollection<T>) {}

  async ElementId(t = Date.now(), trailValue?: bigint) {
    return ObfuscatedTimeId(await this.ObfuscationSeed(), t, trailValue ?? this.TrailValue(t));
  }

  Element(elementId: string) {
    return this.collection.Element(elementId);
  }

  async add(element?: io.TypeOf<T>, t = Date.now(), trailValue?: bigint) {
    const id = await this.ElementId(t, trailValue);
    const storageElement = this.Element(id);

    if (element !== nil) {
      await storageElement.set(element);
    }

    return storageElement;
  }

  async count(): Promise<number> {
    return await this.collection.count();
  }

  async* RangeEntries({
    direction = 'ascending',
    minTime = nil,
    maxTime = nil,
    offset = nil,
  }: {
    direction?: 'ascending' | 'descending',
    minTime?: number,
    maxTime?: number,
    offset?: number,
  } = {}): AsyncGenerator<[string, io.TypeOf<T>]> {
    const obfuscationSeed = await this.ObfuscationSeed();

    for await (const entry of this.collection.RangeEntries({
      direction,
      min: minTime === nil ? nil : ObfuscatedTimeId(obfuscationSeed, minTime, 0n),
      max: maxTime === nil ? nil : ObfuscatedTimeId(obfuscationSeed, maxTime, 0n),
    })) {
      yield entry;
    }
  }

  async* Range({
    direction = 'ascending',
    minTime = nil,
    maxTime = nil,
    offset = nil,
  }: {
    direction?: 'ascending' | 'descending',
    minTime?: number,
    maxTime?: number,
    offset?: number,
  } = {}): AsyncGenerator<io.TypeOf<T>> {
    for await (const [, element] of this.RangeEntries({ direction, minTime, maxTime, offset })) {
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

  private TrailValue(t: number) {
    const dt = t - this.lastGeneratedTrail.time;

    if (0 <= dt && dt < 3000) {
      this.lastGeneratedTrail.time = t;
      this.lastGeneratedTrail.trailValue += 1n + BigInt(Math.floor(100000 * Math.random()));
    } else {
      this.lastGeneratedTrail = {
        time: t,
        trailValue: TrailValue(),
      }
    }

    return this.lastGeneratedTrail.trailValue;
  }
}
