import fetch from 'isomorphic-fetch';

import assert from '../common-pure/assert';
import nil from '../common-pure/nil';

import { PromisishApi } from '../common-pure/protocolHelpers';
import Database from '../database/Database';
import zoomConnections from '../database/queries/zoomConnections';
import ZoomProtocol from '../elo-types/ZoomProtocol';
import type AppComponents from './AppComponents';
import Config from './Config';

export type ZoomProtocolImpl = PromisishApi<ZoomProtocol>;

export default function ZoomProtocolImpl(
  config: Config,
  db: Database,
  presenceEvents: AppComponents['presenceEvents'],
  userId: string,
): ZoomProtocolImpl {
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
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const zoomUser = await meRes.json();
      const { account_id, email } = zoomUser;
      assert(typeof account_id === 'string');
      assert(typeof email === 'string');

      await zoomConnections.upsert(db, {
        user_id: userId,
        zoom_id: account_id,
        zoom_email: email,
        presence_status: nil,
        presence_update_time: nil,
      });

      return { zoomEmail: email };
    },
    lookupZoomEmail: async () => {
      const maybeConn = await zoomConnections.lookup(db, userId);

      return {
        zoomEmail: maybeConn?.zoom_email,
      };
    },
    presence: async ({ longPoll }) => {
      const maybeConn = await zoomConnections.lookup(db, userId);

      if (maybeConn === nil) {
        return { connected: false };
      }

      const conn = maybeConn;

      const {
        presence_status,
        presence_update_time,
      } = conn;

      const presence = (presence_status === nil || presence_update_time === nil
        ? nil
        : {
          value: presence_status,
          lastUpdated: presence_update_time,
        }
      );

      if (!longPoll || longPoll.differentFrom !== presence?.value) {
        return {
          connected: true,
          presence,
        };
      }

      return await new Promise((resolve) => {
        const newPresenceHandler = (
          newPresence: {
            value: string;
            lastUpdated: Date;
          },
        ) => {
          if (newPresence.value !== longPoll.differentFrom) {
            cleanup();

            resolve({
              connected: true,
              presence: newPresence,
            });
          }
        };

        const pleaseRetryHandle = setTimeout(
          () => {
            cleanup();
            resolve('please-retry');
          },

          // A bit less than a minute to avoid nginx's default gateway timeout
          // of one minute
          50000,
        );

        const retestHandle = setTimeout(async () => {
          const retryConn = await zoomConnections.lookup(db, userId);

          const newPresence = (
            (
              retryConn &&
              retryConn.presence_status &&
              retryConn.presence_update_time
            )
              ? {
                value: retryConn.presence_status,
                lastUpdated: retryConn.presence_update_time,
              }
              : nil
          );

          if (newPresence && newPresence.value !== longPoll.differentFrom) {
            console.warn([
              'Hit this case covering a zoom status race condition which is',
              'not ideal and should not be very unlikely',
            ].join(' '));

            cleanup();

            resolve({
              connected: true,
              presence: newPresence,
            });
          }
        }, 5000);

        presenceEvents.on(conn.zoom_id, newPresenceHandler);

        function cleanup() {
          clearTimeout(pleaseRetryHandle);
          clearTimeout(retestHandle);
          presenceEvents.off(conn.zoom_id, newPresenceHandler);
        }
      });
    },
  };

  return impl;
}
