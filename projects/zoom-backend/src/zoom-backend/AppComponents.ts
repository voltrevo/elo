import Koa from 'koa';

import Config from './Config';

type AppComponents = {
  config: Config;
  koaApp: Koa;
};

export default AppComponents;
