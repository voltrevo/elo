import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import route from 'koa-route';

import * as config from '../src/config';
import feedbackHandler from '../src/feedbackHandler';

const app = new Koa();
app.use(cors());
app.use(bodyParser());

app.use(route.post('/feedback', feedbackHandler));

app.listen(config.port);
