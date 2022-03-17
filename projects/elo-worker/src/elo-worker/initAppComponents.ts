import fs from 'fs/promises';

import Koa from 'koa';
import websockify from 'koa-websocket';

import loadConfig from './loadConfig';
import Database from '../database/Database';
import StatsGatherer from './StatsGatherer';
import AppComponents from './AppComponents';
import TokenBicoder from './TokenBicoder';
import SessionTokenData from './SessionTokenData';
import EloLoginTokenData from './EloLoginTokenData';
import EmailService from './EmailService';

export default async function initAppComponents(): Promise<AppComponents> {
  const config = await loadConfig();

  const db = new Database(config.pgConnString);
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

  const sessionTokenBicoder = new TokenBicoder({ config }, SessionTokenData, 7 * 86400);
  const loginTokenBicoder = new TokenBicoder({ config }, EloLoginTokenData, Infinity);

  const emailService = new EmailService({ config, db });

  return {
    config,
    db,
    statsGatherer,
    koaApp,
    sessionTokenBicoder,
    loginTokenBicoder,
    emailService,
  };
}
