import * as io from 'io-ts';
import msgpack from '@msgpack/msgpack';

import StorageProtocol from "../elo-types/StorageProtocol";
import { PromisifyApi } from "../common-pure/protocolHelpers";
import ioBuffer from "../common-pure/ioBuffer";
import nil from '../common-pure/nil';
import decode from '../elo-types/decode';

const GetRangeResult = io.array(io.tuple([io.string, ioBuffer]));
type GetRangeResult = io.TypeOf<typeof GetRangeResult>;

export type IStorageRpcClient = PromisifyApi<StorageProtocol>;

export default class StorageRpcClient implements IStorageRpcClient {
  constructor(
    public rpcUrl: string,
    public eloLoginToken: string,
  ) {}

  async get(collectionId: string, elementId: string): Promise<Uint8Array | nil> {
    const rpcResult = await this.fetchRpc('get', [collectionId, elementId]);

    if (rpcResult instanceof Uint8Array) {
      return rpcResult;
    }

    // null because msgpack doesn't support undefined
    if (rpcResult === null) {
      return nil;
    }

    throw new Error(`Unexpected rpcResult: ${rpcResult}`);
  }

  async set(collectionId: string, elementId: string, value: Uint8Array | nil): Promise<void> {
    await this.fetchRpc('set', [collectionId, elementId, value]);
  }

  async setMulti(
    setCommands: [
      collectionId: string,
      elementId: string,
      value: Uint8Array | undefined,
    ][],
  ): Promise<void> {
    await this.fetchRpc('setMulti', [setCommands]);
  }

  async getRange(collectionId: string, minElementId: string, maxElementId: string): Promise<[string, Uint8Array][]> {
    const rpcResult = await this.fetchRpc('getRange', [collectionId, minElementId, maxElementId]);

    return decode(GetRangeResult, rpcResult);
  }

  private async fetchRpc(method: string, args: unknown): Promise<unknown> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      body: msgpack.encode({
        eloLoginToken: this.eloLoginToken,
        method,
        args,
      }),
    });

    if (response.status !== 200) {
      throw new Error(await response.text());
    }

    return msgpack.decode(await response.arrayBuffer());
  }
}
