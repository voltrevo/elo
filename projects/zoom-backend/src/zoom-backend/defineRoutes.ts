/* eslint-disable no-console */

import route from 'koa-route';

import AppComponents from './AppComponents';

export default function defineRoutes(appComponents: AppComponents) {
  const { koaApp } = appComponents;

  koaApp.use(route.post('/zoom-webhook', async ctx => {
    console.log('POST /zoom-webhook', {
      ip: ctx.ip,
      headers: ctx.request.headers,
    }, JSON.stringify(ctx.request.body, null, 2));

    ctx.status = 200;
  }));
}
