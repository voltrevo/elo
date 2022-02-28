/* eslint-disable no-console */

import route from 'koa-route';

import { generateUserId } from '../userIds';
import AppComponents from '../AppComponents';
import defineAnalyze from './defineAnalyze';
import defineStartSession from './defineStartSession';

export default function defineRoutes(appComponents: AppComponents) {
  const { koaApp } = appComponents;

  defineAnalyze(appComponents);
  defineStartSession(appComponents);

  koaApp.use(route.post('/generateId', async ctx => {
    ctx.body = generateUserId();
  }));
}