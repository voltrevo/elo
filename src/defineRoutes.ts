/* eslint-disable no-console */

import path from 'path';

import route from 'koa-route';
import serveStaticCache from 'koa-static-cache';

import dirs from './dirs';
import { generateUserId } from './userIds';
import defineStartSession from './routes/defineStartSession';
import AppComponents from './AppComponents';
import defineAnalyze from './routes/defineAnalyze';

export default function defineRoutes(appComponents: AppComponents) {
  const { koaApp } = appComponents;

  koaApp.use(serveStaticCache(path.join(dirs.build), {
    alias: {
      '/': '/index.html',
    },
  }));

  defineAnalyze(appComponents);
  defineStartSession(appComponents);

  koaApp.use(route.post('/generateId', async ctx => {
    ctx.body = generateUserId();
  }));
}
