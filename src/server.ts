import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';

import launch from './helpers/launch';
import defineRoutes from './defineRoutes';
import initAppComponents from './initAppComponents';

launch(async (emit) => {
  const appComponents = await initAppComponents();

  const { config, koaApp } = appComponents;

  koaApp.use(cors());
  koaApp.use(bodyParser());

  defineRoutes(appComponents);

  const { host, port } = config.server;

  await new Promise(resolve => koaApp.listen(port, host, () => { resolve(null); }));
  emit(`Serving ${config.server.https ? 'https' : 'http'} on ${host}:${port}`);

  await new Promise(() => {});
});
