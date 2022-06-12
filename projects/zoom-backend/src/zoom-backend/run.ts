import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import EventEmitter from 'events';

import defineRoutes from './defineRoutes';
import Config from './Config';
import runForever from '../common-backend/runForever';
import TokenBicoder from '../common-backend/TokenBicoder';
import EloLoginTokenData from '../common-backend/EloLoginTokenData';
import Database from '../database/Database';
import type AppComponents from './AppComponents';

export default async function run(config: Config) {
  const koaApp = new Koa();

  koaApp.use(cors());

  const bodyParserHandler = bodyParser();

  koaApp.use(async (ctx, next) => {
    if (ctx.path === '/zoom/rpc') {
      await next();
    } else {
      return await bodyParserHandler(ctx, next);
    }
  });

  const loginTokenBicoder = new TokenBicoder(
    config.secrets.tokenEncryption,
    EloLoginTokenData,
    Infinity,
  );

  const database = new Database(config.pgConnString);

  const presenceEvents = new EventEmitter() as AppComponents['presenceEvents'];

  defineRoutes({
    koaApp, config, loginTokenBicoder, database, presenceEvents,
  });

  const { host, port } = config;

  await new Promise(resolve => koaApp.listen(port, host, () => { resolve(null); }));
  console.log(`Serving zoom-backend on ${host}:${port}`);

  return await runForever();
}
