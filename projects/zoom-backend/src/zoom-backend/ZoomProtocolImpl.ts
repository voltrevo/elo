import { PromisifyApi } from '../common-pure/protocolHelpers';
import ZoomProtocol from '../elo-types/ZoomProtocol';

export type ZoomProtocolImpl = PromisifyApi<ZoomProtocol>;

export default function ZoomProtocolImpl(_userId: string): ZoomProtocolImpl {
  const impl: ZoomProtocolImpl = {
    hello: async () => ({
      message: 'world',
    }),
  };

  return impl;
}
