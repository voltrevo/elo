import * as io from 'io-ts';
import route from 'koa-route';
import * as msgpack from '@msgpack/msgpack';
import { parse as parseContentType } from 'content-type';
import getRawBody from 'raw-body';

import type Database from '../database/Database';
import decode from '../elo-types/decode';
import TokenBicoder from '../common-backend/TokenBicoder';
import EloLoginTokenData from '../common-backend/EloLoginTokenData';
import ErrorData from '../common-pure/ErrorData';
import StorageProtocolImpl from './StorageProtocolImpl';
import { StorageProtocolTypeMap } from '../elo-types/StorageProtocol';
import errorHasTag from '../common-pure/errorHasTag';
import deepNullToNil from '../common-pure/deepNullToNil';

type Handler = Parameters<typeof route.post>[1];

const RpcBody = io.type({
  eloLoginToken: io.string,
  method: io.string,
  input: io.unknown,
});

export default function StorageRpcHandler(
  database: Database,
  loginTokenBicoder: TokenBicoder<EloLoginTokenData>,
  userRowLimit: number,
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

    if (!Object.keys(StorageProtocolTypeMap).includes(body.method)) {
      ctx.status = 404;
      ctx.body = `Method not found: ${body.method}`;
      return;
    }

    const method = body.method as keyof typeof StorageProtocolTypeMap;
    const input = decode(StorageProtocolTypeMap[method].input, body.input);

    const userId = loginDecodeResult.userId;
    const storage = StorageProtocolImpl(database, userId, userRowLimit);

    let output;

    try {
      output = await storage[method](input as any);
    } catch (error) {
      if (errorHasTag(error, 'write-limit')) {
        ctx.status = 400;
        ctx.body = (error as Error).message;
        return;
      }

      throw error;
    }

    ctx.status = 200;
    ctx.body = Buffer.from(msgpack.encode(output));
  };
}
