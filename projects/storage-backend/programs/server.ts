import 'source-map-support/register';

import Koa from 'koa';
import cors from '@koa/cors';
import route from 'koa-route';

import loadConfig from '../src/storage-backend/loadConfig';
import StorageRpcHandler from '../src/storage-backend/StorageRpcHandler';
import Database from '../src/database/Database';

const config = loadConfig();

const app = new Koa();
app.use(cors());

const db = new Database(config.pgConnString);

app.use(route.post('/storage/rpc', StorageRpcHandler(db)));

(async () => {
  await new Promise(resolve => app.listen(config.port, '0.0.0.0', () => { resolve(null); }));
  console.log(`Listening on 0.0.0.0:${config.port}`);
})().catch(console.error);
