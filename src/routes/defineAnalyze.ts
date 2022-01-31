import { Readable } from 'stream';

import route from 'koa-route';
import uuid from 'uuid';

import analyze, { AnalysisFragment, analyzeRaw } from '../analyze';
import AppComponents from '../AppComponents';
import wsDataToUint8Array from '../helpers/wsDataToUint8Array';

export default function defineAnalyze({ koaApp, statsGatherer }: AppComponents) {
  koaApp.use(route.post('/analyze', async ctx => {
    ctx.res.statusCode = 200;

    const analysisStream = analyzeRaw(ctx.req, error => {
      console.error(error);
      ctx.res.end();
    });

    analysisStream.pipe(ctx.res);

    await new Promise(resolve => analysisStream.on('end', resolve));
  }));

  koaApp.ws.use(route.all('/analyze', async ctx => {
    const { sessionToken } = ctx.query;

    if (sessionToken !== undefined) {
      // TODO
    }

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

        statsGatherer.process(fragment);

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
