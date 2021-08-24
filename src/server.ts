/* eslint-disable no-console */

import path from 'path';
import { Readable } from 'stream';

import Koa from 'koa';
import websockify from 'koa-websocket';
import route from 'koa-route';
import serveStaticCache from 'koa-static-cache';
import type WebSocket from 'ws';

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
  const app = websockify(new Koa());

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

  app.ws.use(route.all('/analyze', async ctx => {
    let readTargetTranscript = false;

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

    ctx.websocket.on('message', async data => {
      if (!readTargetTranscript) {
        readTargetTranscript = true;

        analyze(webmStream, JSON.parse(data.toString()))
          .then(analysis => {
            ctx.websocket.send(JSON.stringify(analysis));
            ctx.websocket.close();
          });
      } else {
        const chunk = wsDataToUint8Array(data);
        // console.log(`Received ${chunk.length} bytes`);

        if (chunk.length !== 0) {
          write(chunk);
        } else {
          write(null);
        }
      }
    });
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
