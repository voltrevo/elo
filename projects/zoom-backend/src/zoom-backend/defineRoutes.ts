/* eslint-disable no-console */

import route from 'koa-route';

import AppComponents from './AppComponents';
import ZoomRpcHandler from './ZoomRpcHandler';

export default function defineRoutes(appComponents: AppComponents) {
  const { koaApp, config, loginTokenBicoder } = appComponents;

  koaApp.use(route.post('/zoom-webhook', async ctx => {
    if (ctx.request.headers.authorization !== config.verificationToken) {
      ctx.status = 401;
      console.error('Unauthorized POST /zoom-webhook');
      return;
    }

    console.log('POST /zoom-webhook', {
      ip: ctx.ip,
      headers: ctx.request.headers,
    }, JSON.stringify(ctx.request.body, null, 2));

    ctx.status = 200;
  }));

  koaApp.use(route.post('/zoom/rpc', ZoomRpcHandler(loginTokenBicoder)));
}
