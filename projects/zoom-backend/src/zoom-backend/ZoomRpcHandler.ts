import * as io from 'io-ts';
import route from 'koa-route';
import * as msgpack from '@msgpack/msgpack';
import { parse as parseContentType } from 'content-type';
import getRawBody from 'raw-body';

import decode from '../elo-types/decode';
import TokenBicoder from '../common-backend/TokenBicoder';
import EloLoginTokenData from '../common-backend/EloLoginTokenData';
import ErrorData from '../common-pure/ErrorData';
import ZoomProtocolImpl from './ZoomProtocolImpl';
import { ZoomProtocolTypeMap } from '../elo-types/ZoomProtocol';
import Config from './Config';
import Database from '../database/Database';
import AppComponents from './AppComponents';
import deepNullToNil from '../common-pure/deepNullToNil';

type Handler = Parameters<typeof route.post>[1];

const RpcBody = io.type({
  eloLoginToken: io.string,
  method: io.string,
  input: io.unknown,
});

export default function ZoomRpcHandler(
  config: Config,
  database: Database,
  presenceEvents: AppComponents['presenceEvents'],
  loginTokenBicoder: TokenBicoder<EloLoginTokenData>,
): Handler {
  return async (ctx) => {
    const rawBody: unknown = await getRawBody(ctx.req, {
      length: ctx.req.headers['content-length'],
      limit: '1mb',
      encoding: parseContentType(ctx.req).parameters.charset,
    });

    if (!(rawBody instanceof Uint8Array)) {
      ctx.status = 400;
      ctx.body = 'Expected raw bytes';
      return;
    }

    const body = decode(RpcBody, deepNullToNil(msgpack.decode(rawBody)));

    const loginDecodeResult = loginTokenBicoder.decode(body.eloLoginToken);

    if (loginDecodeResult instanceof ErrorData) {
      if (loginDecodeResult.type === 'internal') {
        console.error('eloLoginToken decode failed:', loginDecodeResult.detail);
        ctx.status = 500;
        return;
      }

      console.log('eloLoginToken decode failed:', loginDecodeResult.detail);

      ctx.status = 401;
      ctx.body = 'Unauthorized';
      return;
    }

    if (!Object.keys(ZoomProtocolTypeMap).includes(body.method)) {
      ctx.status = 404;
      ctx.body = `Method not found: ${body.method}`;
      return;
    }

    const method = body.method as keyof typeof ZoomProtocolTypeMap;
    const input = decode(ZoomProtocolTypeMap[method].input, body.input);

    const userId = loginDecodeResult.userId;
    const zoom = ZoomProtocolImpl(config, database, presenceEvents, userId);

    let output;

    // eslint-disable-next-line no-useless-catch
    try {
      output = await zoom[method](input as any);
    } catch (error) {
      // Detect errors that can be passed along to the client here
      // (Otherwise the error content will only be on the console and the client
      // will get an opaque 500)
      throw error;
    }

    ctx.status = 200;
    ctx.body = Buffer.from(msgpack.encode(output));
  };
}
