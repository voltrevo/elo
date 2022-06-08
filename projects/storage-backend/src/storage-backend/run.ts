import 'source-map-support/register';

import Koa from 'koa';
import cors from '@koa/cors';
import route from 'koa-route';

import StorageRpcHandler from './StorageRpcHandler';
import Database from '../../src/database/Database';
import TokenBicoder from '../../src/common-backend/TokenBicoder';
import EloLoginTokenData from '../../src/common-backend/EloLoginTokenData';
import Config from './Config';
import runForever from '../../src/common-backend/runForever';

export default async function run(config: Config) {
  const app = new Koa();
  app.use(cors());
  
  const db = new Database(config.pgConnString);
  const loginTokenBicoder = new TokenBicoder(config.secrets.tokenEncryption, EloLoginTokenData, Infinity);
  
  app.use(route.post('/storage/rpc', StorageRpcHandler(db, loginTokenBicoder, config.userRowLimit)));
  
  (async () => {
    await new Promise(resolve => app.listen(config.port, '0.0.0.0', () => { resolve(null); }));
    console.log(`storage-backend listening on 0.0.0.0:${config.port}`);
  })().catch(console.error);

  return await runForever();
}
