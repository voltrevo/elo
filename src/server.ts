import Koa from 'koa';
import websockify from 'koa-websocket';

import config from './helpers/config';
import launch from './helpers/launch';
import defineRoutes from './defineRoutes';
import DbClient from './database/DbClient';

launch(async (emit) => {
  const app = websockify(new Koa());
  const db = await DbClient.connect(config.server.pgConnString);

  defineRoutes(app, { db });

  const { host, port } = config.server;

  await new Promise(resolve => app.listen(port, host, () => { resolve(null); }));
  emit(`HTTP: Listening on ${host}:${port}`);

  await new Promise(() => {});
});
