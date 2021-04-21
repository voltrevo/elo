/* eslint-disable no-console */

import path from 'path';

import Koa from 'koa';
import route from 'koa-route';
import serveStaticCache from 'koa-static-cache';

import dirs from './dirs';
import launch from './helpers/launch';
import analyze from './analyze';
import base58 from './helpers/base58';

function sanitizeHeader(headerValue: string | string[] | undefined): string | null {
  if (Array.isArray(headerValue)) {
    return headerValue[headerValue.length - 1] ?? null;
  }

  return headerValue ?? null;
}

launch(async (emit) => {
  const app = new Koa();

  app.use(serveStaticCache(path.join(dirs.build, 'web'), {
    alias: {
      '/': '/index.html',
    },
  }));

  app.use(route.post('/analyze', async ctx => {
    const targetTranscriptEncoded = sanitizeHeader(ctx.headers['x-target-transcript']);
    let targetTranscript: string | null = null;

    if (targetTranscriptEncoded !== null) {
      targetTranscript = new TextDecoder().decode(base58.decode(targetTranscriptEncoded));
    }

    ctx.body = JSON.stringify(await analyze(ctx.req, targetTranscript));
  }));

  await new Promise(resolve => app.listen(8080, '127.0.0.1', () => { resolve(null); }));
  emit('HTTP: Listening on 127.0.0.1:8080');

  await new Promise(() => {});
});
