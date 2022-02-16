import 'source-map-support/register';

import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import route from 'koa-route';

import config from '../src/config';
import FeedbackHandler from '../src/FeedbackHandler';
import DbClient from '../src/database/DbClient';

const app = new Koa();
app.use(cors());
app.use(bodyParser());

const dbClient = new DbClient(config.pgConnString);

app.use(route.post('/feedback', FeedbackHandler(dbClient)));

app.listen(config.port);
