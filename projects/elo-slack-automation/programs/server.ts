import 'source-map-support/register';

import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import route from 'koa-route';

import config from '../src/elo-slack-automation/config';
import FeedbackHandler from '../src/elo-slack-automation/FeedbackHandler';
import Database from '../src/database/Database';

const app = new Koa();
app.use(cors());
app.use(bodyParser());

const db = new Database(config.pgConnString);

app.use(route.post('/feedback', FeedbackHandler(db)));

app.listen(config.port);
