/* eslint-disable no-console */

import route from 'koa-route';

import AppComponents from './AppComponents';

export default function defineRoutes(appComponents: AppComponents) {
  const { koaApp } = appComponents;

  koaApp.use(route.post('/zoom-webhook-test', async ctx => {
    console.log('POST /zoom-webhook-test', {
      ip: ctx.ip,
      headers: ctx.request.headers,
      body: ctx.request.body,
    });

    ctx.status = 200;
  }));
}
