import Koa from 'koa';

import EloLoginTokenData from '../common-backend/EloLoginTokenData';
import TokenBicoder from '../common-backend/TokenBicoder';
import Database from '../database/Database';
import Config from './Config';

type AppComponents = {
  config: Config;
  koaApp: Koa;
  loginTokenBicoder: TokenBicoder<EloLoginTokenData>;
  database: Database;
};

export default AppComponents;
