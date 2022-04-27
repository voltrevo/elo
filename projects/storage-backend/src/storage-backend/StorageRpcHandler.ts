import route from 'koa-route';
import { parse as parseContentType } from 'content-type';
import getRawBody from 'raw-body';

import type Database from '../database/Database';

type Handler = Parameters<typeof route.post>[1];

export default function StorageRpcHandler(database: Database): Handler {
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

    console.log(rawBody);

    throw new Error('Not implemented');
  };
}
