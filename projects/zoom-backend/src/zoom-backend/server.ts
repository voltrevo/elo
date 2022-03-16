import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';

import launch from './helpers/launch';
import loadConfig from './loadConfig';
import defineRoutes from './defineRoutes';

launch(async (emit) => {
  const koaApp = new Koa();
  const config = await loadConfig();

  koaApp.use(cors());
  koaApp.use(bodyParser());

  defineRoutes({ koaApp, config });

  const { host, port } = config;

  await new Promise(resolve => koaApp.listen(port, host, () => { resolve(null); }));
  emit(`Serving http on ${host}:${port}`);

  await new Promise(() => {});
});
