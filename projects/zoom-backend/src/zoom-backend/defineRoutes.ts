/* eslint-disable no-console */

import route from 'koa-route';
import assert from '../common-pure/assert';
import zoomConnections from '../database/queries/zoomConnections';

import AppComponents from './AppComponents';
import ZoomRpcHandler from './ZoomRpcHandler';

export default function defineRoutes(appComponents: AppComponents) {
  const {
    koaApp, config, loginTokenBicoder, database, presenceEvents,
  } = appComponents;

  koaApp.use(route.post('/zoom-webhook', async ctx => {
    if (ctx.request.headers.authorization !== config.verificationToken) {
      ctx.status = 401;
      console.error('Unauthorized POST /zoom-webhook');
      return;
    }

    const { account_id } = ctx.request.body.payload;
    const { presence_status, date_time } = ctx.request.body.payload.object;
    assert(typeof account_id === 'string');
    assert(typeof presence_status === 'string');
    assert(typeof date_time === 'string');

    await zoomConnections.updatePresence(
      database,
      account_id,
      presence_status,
      new Date(date_time),
    );

    presenceEvents.emit(account_id, {
      value: presence_status,
      lastUpdated: new Date(date_time),
    });

    ctx.status = 200;
  }));

  koaApp.use(route.post(
    '/zoom/rpc',
    ZoomRpcHandler(
      config,
      database,
      presenceEvents,
      loginTokenBicoder,
    ),
  ));
}
