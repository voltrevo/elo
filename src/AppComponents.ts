import type { App as KoaApp } from 'koa-websocket';
import type Koa from 'koa';

import type DbClient from './database/DbClient';
import type { ConfigType } from './helpers/ConfigType';
import type StatsGatherer from './StatsGatherer';
import type SessionTokenBicoder from './SessionTokenBicoder';

type AppComponentMap = {
  config: ConfigType;
  db: DbClient;
  statsGatherer: StatsGatherer;
  koaApp: KoaApp<Koa.DefaultState, Koa.DefaultContext>;
  sessionTokenBicoder: SessionTokenBicoder;
};

type AppComponents<K extends keyof AppComponentMap = keyof AppComponentMap> =
  Pick<AppComponentMap, K>;

export default AppComponents;
