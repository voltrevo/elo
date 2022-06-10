import fetch from 'isomorphic-fetch';
import assert from '../common-pure/assert';

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
      zoomUrl.searchParams.set('redirect_uri', config.zoomApp.redirectUri);

      const tokenRes = await fetch(zoomUrl.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from([
            config.zoomApp.id,
            config.zoomApp.secret,
          ].join(':')).toString('base64')}`,
        },
      });

      const { access_token, refresh_token } = await tokenRes.json();
      assert(typeof access_token === 'string');
      assert(typeof refresh_token === 'string');

      const meRes = await fetch('https://api.zoom.us/v2/users/me', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refresh_token}`,
        },
      });

      console.log({ zoomUser: await meRes.json() });

      throw new Error('Not implemented');
    },
  };

  return impl;
}
