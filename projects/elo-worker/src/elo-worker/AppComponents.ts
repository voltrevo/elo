import type { App as KoaApp } from 'koa-websocket';
import type Koa from 'koa';

import type Database from '../database/Database';
import type StatsGatherer from './StatsGatherer';
import type TokenBicoder from './TokenBicoder';
import type { Config } from './Config';
import SessionTokenData from './SessionTokenData';
import EloLoginTokenData from './EloLoginTokenData';
import EmailService from './EmailService';

type AppComponentMap = {
  config: Config;
  db: Database;
  statsGatherer: StatsGatherer;
  koaApp: KoaApp<Koa.DefaultState, Koa.DefaultContext>;
  sessionTokenBicoder: TokenBicoder<SessionTokenData>;
  loginTokenBicoder: TokenBicoder<EloLoginTokenData>;
  emailService: EmailService;
};

type AppComponents<K extends keyof AppComponentMap = keyof AppComponentMap> =
  Pick<AppComponentMap, K>;

export default AppComponents;
