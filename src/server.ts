import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';

import launch from './helpers/launch';
import defineRoutes from './routes/defineRoutes';
import initAppComponents from './initAppComponents';

launch(async (emit) => {
  const appComponents = await initAppComponents();

  const { config, koaApp } = appComponents;

  koaApp.use(cors());

  const bodyParserHandler = bodyParser();

  koaApp.use(async (ctx, next) => {
    if (ctx.path === '/analyze') {
      await next();
    } else {
      return await bodyParserHandler(ctx, next);
    }
  });

  defineRoutes(appComponents);

  const { host, port } = config.server;

  await new Promise(resolve => koaApp.listen(port, host, () => { resolve(null); }));
  emit(`Serving ${config.server.https ? 'https' : 'http'} on ${host}:${port}`);

  await new Promise(() => {});
});
