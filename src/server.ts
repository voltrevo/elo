/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

import Koa from 'koa';
import route from 'koa-route';
import serveStaticCache from 'koa-static-cache';
import { streamToBuffer } from '@jorgeferrero/stream-to-buffer';
import ffmpeg from 'ffmpeg';

import dirs from './dirs';
import launch from './helpers/launch';

launch(async (emit) => {
  const app = new Koa();

  app.use(serveStaticCache(path.join(dirs.build, 'web'), {
    alias: {
      '/': '/index.html',
    },
  }));

  app.use(route.post('/analyze', async ctx => {
    console.log(ctx.req.headers['content-length']);

    const saveFile = `${dirs.data}/recordings/${Date.now()}.webm`;

    const buffer = await streamToBuffer(ctx.req);
    await fs.promises.writeFile(saveFile, buffer);

    const ffmpegCtx = (await (new ffmpeg(saveFile)));
    ffmpegCtx.setDisableVideo();
    await ffmpegCtx.save(saveFile.replace(/\.webm$/, '.wav'));

    ctx.body = JSON.stringify({ msg: 'todo' });
  }));

  await new Promise(resolve => app.listen(8080, '127.0.0.1', () => { resolve(null); }));
  emit('HTTP: Listening on 127.0.0.1:8080');

  await new Promise(() => {});
});
