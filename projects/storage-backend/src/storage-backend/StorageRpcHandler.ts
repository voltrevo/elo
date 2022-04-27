import * as io from 'io-ts';
import route from 'koa-route';
import msgpack from '@msgpack/msgpack';
import { parse as parseContentType } from 'content-type';
import getRawBody from 'raw-body';

import type Database from '../database/Database';
import decode from '../elo-types/decode';
import TokenBicoder from '../common-backend/TokenBicoder';
import EloLoginTokenData from '../common-backend/EloLoginTokenData';
import ErrorData from '../common-pure/ErrorData';

type Handler = Parameters<typeof route.post>[1];

const RpcBody = io.type({
  eloLoginToken: io.string,
  method: io.string,
  input: io.unknown,
});

export default function StorageRpcHandler(
  database: Database,
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

    const body = decode(RpcBody, msgpack.decode(rawBody));

    const loginDecodeResult = loginTokenBicoder.decode(body.eloLoginToken);

    if (loginDecodeResult instanceof ErrorData) {
      console.log('eloLoginToken decode failed:', loginDecodeResult.detail);

      if (loginDecodeResult.type === 'internal') {
        ctx.status = 500;
        return;
      }

      ctx.status = 401;
      ctx.body = 'Unauthorized';
      return;
    }

    const userId = loginDecodeResult.userId;

    throw new Error('Not implemented');
  };
}
