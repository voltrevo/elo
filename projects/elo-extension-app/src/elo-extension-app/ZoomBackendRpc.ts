import * as msgpack from '@msgpack/msgpack';

import deepNullToNil from '../common-pure/deepNullToNil';
import { PromisifyApi } from "../common-pure/protocolHelpers";
import decode from '../elo-types/decode';
import ZoomProtocol, { ZoomProtocolInput, ZoomProtocolOutput, ZoomProtocolTypeMap } from '../elo-types/ZoomProtocol';

export type IZoomBackendRpc = PromisifyApi<ZoomProtocol>;

export default class ZoomBackendRpc implements IZoomBackendRpc {
  constructor(
    public rpcUrl: string,
    public eloLoginToken: string,
  ) {}

  hello = this.createMethod('hello');
  connect = this.createMethod('connect');
  disconnect = this.createMethod('disconnect');
  lookupZoomEmail = this.createMethod('lookupZoomEmail');
  presence = this.createMethod('presence');

  private createMethod<M extends keyof typeof ZoomProtocolTypeMap>(method: M) {
    return async (input: ZoomProtocolInput<M>): Promise<ZoomProtocolOutput<M>> => {
      const rpcResult = await this.fetchRpc(method, input);
      return decode(ZoomProtocolTypeMap[method].output, rpcResult);
    };
  }

  private async fetchRpc(method: string, input: unknown): Promise<unknown> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/octet-stream',
      },
      body: msgpack.encode({
        eloLoginToken: this.eloLoginToken,
        method,
        input,
      }),
    });

    if (response.status >= 400) {
      throw new Error(await response.text());
    }

    return deepNullToNil(msgpack.decode(await response.arrayBuffer()));
  }
}
