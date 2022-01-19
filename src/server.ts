import fs from 'fs/promises';

import Koa from 'koa';
import websockify from 'koa-websocket';
import cors from '@koa/cors';

import config from './helpers/config';
import launch from './helpers/launch';
import defineRoutes from './defineRoutes';
import DbClient from './database/DbClient';
import StatsGatherer from './StatsGatherer';

launch(async (emit) => {
  const app = websockify(
    new Koa(),
    {},
    {
      ...(config.server.https ? {
        key: await fs.readFile(config.server.https.key),
        cert: await fs.readFile(config.server.https.cert),
      } : {}),
    },
  );

  app.use(cors());

  const db = new DbClient(config.server.pgConnString);
  const statsGatherer = new StatsGatherer(db);

  defineRoutes(app, { db, statsGatherer });

  const { host, port } = config.server;

  await new Promise(resolve => app.listen(port, host, () => { resolve(null); }));
  emit(`Serving ${config.server.https ? 'https' : 'http'} on ${host}:${port}`);

  await new Promise(() => {});
});
