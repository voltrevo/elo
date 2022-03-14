import type { App as KoaApp } from 'koa-websocket';
import type Koa from 'koa';

import type Database from '../database/Database';
import type StatsGatherer from './StatsGatherer';
import type SessionTokenBicoder from './SessionTokenBicoder';
import type { Config } from './Config';

type AppComponentMap = {
  config: Config;
  db: Database;
  statsGatherer: StatsGatherer;
  koaApp: KoaApp<Koa.DefaultState, Koa.DefaultContext>;
  sessionTokenBicoder: SessionTokenBicoder;
};

type AppComponents<K extends keyof AppComponentMap = keyof AppComponentMap> =
  Pick<AppComponentMap, K>;

export default AppComponents;
