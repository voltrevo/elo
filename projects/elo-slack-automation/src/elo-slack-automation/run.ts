import 'source-map-support/register';

import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import route from 'koa-route';

import Config from './Config';
import Database from '../database/Database';
import FeedbackHandler from './FeedbackHandler';

export default async function run(config: Config) {
  const app = new Koa();
  app.use(cors());
  app.use(bodyParser());
  
  const db = new Database(config.pgConnString);
  
  app.use(route.post('/feedback', FeedbackHandler(config, db)));
  
  app.listen(config.port);
}
