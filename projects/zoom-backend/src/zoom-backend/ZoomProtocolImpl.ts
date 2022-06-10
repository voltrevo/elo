import fetch from 'isomorphic-fetch';

import { PromisifyApi } from '../common-pure/protocolHelpers';
import ZoomProtocol from '../elo-types/ZoomProtocol';
import Config from './Config';

export type ZoomProtocolImpl = PromisifyApi<ZoomProtocol>;

export default function ZoomProtocolImpl(config: Config, _userId: string): ZoomProtocolImpl {
  const impl: ZoomProtocolImpl = {
    hello: async () => ({
      message: 'world',
    }),
    connect: async ({ zoomAuthCode }) => {
      const zoomUrl = new URL('https://zoom.us/oauth/token');

      zoomUrl.searchParams.set('grant_type', 'authorization_code');
      zoomUrl.searchParams.set('code', zoomAuthCode);

      // TODO: Can I just not set this?
      zoomUrl.searchParams.set('redirect_uri', 'https://abcd.example.com');

      const res = await fetch(zoomUrl.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from([
            config.zoomApp.id,
            config.zoomApp.secret,
          ].join(':')).toString('base64')}`,
        },
      });

      const token = await res.text();
      console.log({ token });

      throw new Error('Not implemented');
    },
  };

  return impl;
}
