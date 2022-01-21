import fs from 'fs/promises';

import Koa from 'koa';
import websockify from 'koa-websocket';

import config from './helpers/config';
import DbClient from './database/DbClient';
import StatsGatherer from './StatsGatherer';
import AppComponents from './AppComponents';

export default async function initAppComponents(): Promise<AppComponents> {
  const db = new DbClient(config.server.pgConnString);
  const statsGatherer = new StatsGatherer(db);

  const koaApp = config.server.https
    ? websockify(
      new Koa(),
      {},
      {
        key: await fs.readFile(config.server.https.key),
        cert: await fs.readFile(config.server.https.cert),
      },
    )
    : websockify(new Koa());

  return {
    config,
    db,
    statsGatherer,
    koaApp,
  };
}
