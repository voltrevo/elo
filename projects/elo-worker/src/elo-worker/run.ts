import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';

import Config from './Config';
import initAppComponents from './initAppComponents';
import defineRoutes from './routes/defineRoutes';

export default async function run(config: Config) {
  const appComponents = await initAppComponents(config);

  const { koaApp } = appComponents;

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

  const { host, port } = config;

  await new Promise(resolve => koaApp.listen(port, host, () => { resolve(null); }));
  console.log(`Serving ${config.https ? 'https' : 'http'} on ${host}:${port}`);

  await new Promise(() => {});
}
