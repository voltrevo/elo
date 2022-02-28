import fs from 'fs/promises';

import Koa from 'koa';
import websockify from 'koa-websocket';

import config from './helpers/serverConfig';
import DbClient from '../database/DbClient';
import StatsGatherer from './StatsGatherer';
import AppComponents from './AppComponents';
import SessionTokenBicoder from './SessionTokenBicoder';

export default async function initAppComponents(): Promise<AppComponents> {
  const db = new DbClient(config.pgConnString);
  const statsGatherer = new StatsGatherer({ db });

  const koaApp = config.https
    ? websockify(
      new Koa(),
      {},
      {
        key: await fs.readFile(config.https.key),
        cert: await fs.readFile(config.https.cert),
      },
    )
    : websockify(new Koa());

  const sessionTokenBicoder = new SessionTokenBicoder({ config });

  return {
    config,
    db,
    statsGatherer,
    koaApp,
    sessionTokenBicoder,
  };
}