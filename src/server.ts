/* eslint-disable no-console */

import path from 'path';

import Koa from 'koa';
import route from 'koa-route';
import serveStaticCache from 'koa-static-cache';

import dirs from './dirs';
import launch from './helpers/launch';

launch(async (emit) => {
  const app = new Koa();

  app.use(serveStaticCache(path.join(dirs.build, 'web'), {
    alias: {
      '/': '/index.html',
    },
  }));

  app.use(route.post('/analyze', ctx => {
    console.log(ctx.req.headers['content-length']);
    ctx.body = JSON.stringify({ msg: 'todo' });
  }));

  await new Promise(resolve => app.listen(8080, '127.0.0.1', () => { resolve(null); }));
  emit('HTTP: Listening on 127.0.0.1:8080');

  await new Promise(() => {});
});
