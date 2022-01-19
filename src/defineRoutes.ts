/* eslint-disable no-console */

import path from 'path';
import { Readable } from 'stream';

import type { App } from 'koa-websocket';
import type Koa from 'koa';
import route from 'koa-route';
import serveStaticCache from 'koa-static-cache';
import uuid from 'uuid';

import dirs from './dirs';
import analyze, { AnalysisFragment, analyzeRaw } from './analyze';
import wsDataToUint8Array from './helpers/wsDataToUint8Array';

export default function defineRoutes(
  app: App<Koa.DefaultState, Koa.DefaultContext>,
) {
  app.use(serveStaticCache(path.join(dirs.build), {
    alias: {
      '/': '/index.html',
    },
  }));

  app.use(route.post('/analyze', async ctx => {
    ctx.res.statusCode = 200;

    const analysisStream = analyzeRaw(ctx.req, error => {
      console.error(error);
      ctx.res.end();
    });

    analysisStream.pipe(ctx.res);

    await new Promise(resolve => analysisStream.on('end', resolve));
  }));

  app.ws.use(route.all('/analyze', async ctx => {
    // TODO: Limit buffered chunks
    const chunks: (Uint8Array | null)[] = [];
    let readBytesWaiting = 1;

    const webmStream = new Readable({
      read(size) {
        readBytesWaiting = Math.max(readBytesWaiting, size);

        while (readBytesWaiting > 0) {
          const chunk = chunks.shift();

          if (chunk === undefined) {
            break;
          }

          readBytesWaiting -= chunk?.length ?? 0;
          webmStream.push(chunk);
        }
      },
    });

    function write(chunk: Uint8Array | null) {
      if (readBytesWaiting > 0) {
        const bytesProvided = chunk?.length ?? 0;
        readBytesWaiting = Math.max(0, readBytesWaiting - bytesProvided);
        webmStream.push(chunk);
      } else {
        chunks.push(chunk);
      }
    }

    analyze(
      webmStream,
      fragment => {
        ctx.websocket.send(JSON.stringify(fragment));

        if (fragment.type === 'end') {
          ctx.websocket.close();
        }
      },
      error => {
        const id = uuid.v4();
        console.error(id, error);

        const errorFragment: AnalysisFragment = {
          type: 'error',
          value: { message: id },
        };

        ctx.websocket.send(JSON.stringify(errorFragment));
        ctx.websocket.close();

        write(null);
      },
    );

    ctx.websocket.on('message', async data => {
      const chunk = wsDataToUint8Array(data);

      if (chunk.length !== 0) {
        write(chunk);
      } else {
        write(null);
      }
    });

    ctx.websocket.on('close', () => write(null));
  }));
}
