import Koa from 'koa';
import TypedEmitter from 'typed-emitter';

import EloLoginTokenData from '../common-backend/EloLoginTokenData';
import TokenBicoder from '../common-backend/TokenBicoder';
import Database from '../database/Database';
import Config from './Config';

type AppComponents = {
  config: Config;
  koaApp: Koa;
  loginTokenBicoder: TokenBicoder<EloLoginTokenData>;
  database: Database;

  // TODO: When zoom-backend no longer fits into a single process, we need to be
  // able to listen and emit these events across the platform
  events: TypedEmitter<
    Record<string, (presence: {
      value: string,
      lastUpdated: Date,
    }) => void>
  >;
};

export default AppComponents;
