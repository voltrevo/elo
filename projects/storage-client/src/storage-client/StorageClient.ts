import * as io from 'io-ts';
import msgpack from '@msgpack/msgpack';

import StorageRpcClient from "./StorageRpcClient";
import nil from '../common-pure/nil';
import { decryptWithKeyHash, encryptWithKeyHash, getKeyHash } from './encryption';
import StorageKeyCalculator from './StorageKeyCalculator';
import decode from '../elo-types/decode';
import buffersEqual from '../common-pure/buffersEqual';

export default class StorageClient {
  constructor(
    public rpcClient: StorageRpcClient,
    public keyCalculator: StorageKeyCalculator,
  ) {}

  async get<T extends io.Mixed>(type: T, id: string): Promise<T | nil> {
    const encryptedBuf = await this.rpcClient.get('key-value', id);

    if (encryptedBuf === nil) {
      return nil;
    }

    const keyHash = getKeyHash(encryptedBuf);
    const key = await this.keyCalculator.calculateKey(keyHash);
    const buf = decryptWithKeyHash(key, encryptedBuf);

    const untypedValue = msgpack.decode(buf);

    const value = decode(type, untypedValue);

    if (!buffersEqual(key, this.keyCalculator.latestKey)) {
      await this.set(type, id, value);
    }

    return value;
  }

  async set<T extends io.Mixed>(type: T, id: string, value: T | nil) {
    if (value === nil) {
      await this.rpcClient.set('key-value', id, nil);
      return;
    }

    const encryptedBuf = encryptWithKeyHash(this.keyCalculator.latestKey, msgpack.encode(value));
    await this.rpcClient.set('key-value', id, encryptedBuf);
  }
}
