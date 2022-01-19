import Koa from 'koa';
import websockify from 'koa-websocket';

import config from './helpers/config';
import launch from './helpers/launch';
import defineRoutes from './defineRoutes';
import DbClient from './database/DbClient';
import StatsGatherer from './StatsGatherer';

launch(async (emit) => {
  const app = websockify(new Koa());
  const db = new DbClient(config.server.pgConnString);
  const statsGatherer = new StatsGatherer(db);

  defineRoutes(app, { db, statsGatherer });

  const { host, port } = config.server;

  await new Promise(resolve => app.listen(port, host, () => { resolve(null); }));
  emit(`HTTP: Listening on ${host}:${port}`);

  await new Promise(() => {});
});
