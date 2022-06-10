import Koa from 'koa';

import EloLoginTokenData from '../common-backend/EloLoginTokenData';
import TokenBicoder from '../common-backend/TokenBicoder';
import Config from './Config';

type AppComponents = {
  config: Config;
  koaApp: Koa;
  loginTokenBicoder: TokenBicoder<EloLoginTokenData>;
};

export default AppComponents;
