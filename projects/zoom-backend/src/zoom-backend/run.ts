import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';

import defineRoutes from './defineRoutes';
import Config from './Config';
import runForever from '../common-backend/runForever';
import TokenBicoder from '../common-backend/TokenBicoder';
import EloLoginTokenData from '../common-backend/EloLoginTokenData';

export default async function run(config: Config) {
  const koaApp = new Koa();

  koaApp.use(cors());
  koaApp.use(bodyParser());

  const loginTokenBicoder = new TokenBicoder(
    config.secrets.tokenEncryption,
    EloLoginTokenData,
    Infinity,
  );

  defineRoutes({ koaApp, config, loginTokenBicoder });

  const { host, port } = config;

  await new Promise(resolve => koaApp.listen(port, host, () => { resolve(null); }));
  console.log(`Serving zoom-backend on ${host}:${port}`);

  return await runForever();
}
