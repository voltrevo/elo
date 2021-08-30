/* eslint-disable no-console */

import path from 'path';
import { Readable } from 'stream';

import Koa from 'koa';
import websockify from 'koa-websocket';
import route from 'koa-route';
import serveStaticCache from 'koa-static-cache';
import type WebSocket from 'ws';
import uuid from 'uuid';

import dirs from './dirs';
import launch from './helpers/launch';
import analyze, { AnalysisFragment, analyzeRaw } from './analyze';

launch(async (emit) => {
  const app = websockify(new Koa());

  app.use(serveStaticCache(path.join(dirs.build, 'demo'), {
    alias: {
      '/': '/index.html',
    },
  }));

  app.use(route.post('/analyze', async ctx => {
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
        // console.log('read', size, { readBytesWaiting });

        while (readBytesWaiting > 0) {
          const chunk = chunks.shift();

          if (chunk === undefined) {
            break;
          }

          readBytesWaiting -= chunk?.length ?? 0;
          // console.log(`Pushing ${chunk?.length ?? 0} bytes`, { readBytesWaiting });
          webmStream.push(chunk);
        }
      },
    });

    function write(chunk: Uint8Array | null) {
      if (readBytesWaiting > 0) {
        const bytesProvided = chunk?.length ?? 0;
        readBytesWaiting = Math.max(0, readBytesWaiting - bytesProvided);
        // console.log(`Pushing ${chunk?.length ?? 0} bytes`, { readBytesWaiting });
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
      // console.log(`Received ${chunk.length} bytes`);

      if (chunk.length !== 0) {
        write(chunk);
      } else {
        write(null);
      }
    });

    ctx.websocket.on('close', () => write(null));
  }));

  const host = process.env.HOST ?? '127.0.0.1';
  const port = Number(process.env.PORT ?? 36582);

  await new Promise(resolve => app.listen(port, host, () => { resolve(null); }));
  emit(`HTTP: Listening on ${host}:${port}`);

  await new Promise(() => {});
});

function wsDataToUint8Array(data: WebSocket.Data): Uint8Array {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data);
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (Array.isArray(data)) {
    const len = data.map(b => b.length).reduce((a, b) => a + b);
    const buf = new Uint8Array(len);
    let pos = 0;

    for (const dataBuf of data) {
      buf.set(dataBuf, pos);
      pos += dataBuf.length;
    }

    return buf;
  }

  if (data instanceof Buffer) {
    return data;
  }

  throw new Error('Unexpected websocket data');
}
