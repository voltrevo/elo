import msgpack from '@msgpack/msgpack';

import StorageProtocol, { StorageProtocolInput, StorageProtocolOutput, StorageProtocolTypeMap } from "../elo-types/StorageProtocol";
import { PromisifyApi } from "../common-pure/protocolHelpers";
import decode from '../elo-types/decode';

export type IStorageRpcClient = PromisifyApi<StorageProtocol>;

export default class StorageRpcClient implements IStorageRpcClient {
  constructor(
    public rpcUrl: string,
    public eloLoginToken: string,
  ) {}

  get = this.createMethod('get');
  set = this.createMethod('set');
  setMulti = this.createMethod('setMulti');
  getRange = this.createMethod('getRange');
  count = this.createMethod('count');
  UsageInfo = this.createMethod('UsageInfo');

  private createMethod<M extends keyof typeof StorageProtocolTypeMap>(method: M) {
    return async (input: StorageProtocolInput<M>): Promise<StorageProtocolOutput<M>> => {
      const rpcResult = await this.fetchRpc(method, input);
      return decode(StorageProtocolTypeMap[method].output, rpcResult);
    };
  }

  private async fetchRpc(method: string, input: unknown): Promise<unknown> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      body: msgpack.encode({
        eloLoginToken: this.eloLoginToken,
        method,
        input,
      }),
    });

    if (response.status >= 400) {
      throw new Error(await response.text());
    }

    return msgpack.decode(await response.arrayBuffer());
  }
}
