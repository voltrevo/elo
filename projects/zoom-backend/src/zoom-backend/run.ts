import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';

import defineRoutes from './defineRoutes';
import Config from './Config';
import runForever from '../common-backend/runForever';

export default async function run(config: Config) {
  const koaApp = new Koa();

  koaApp.use(cors());
  koaApp.use(bodyParser());

  defineRoutes({ koaApp, config });

  const { host, port } = config;

  await new Promise(resolve => koaApp.listen(port, host, () => { resolve(null); }));
  console.log(`Serving http on ${host}:${port}`);

  return await runForever();
}
