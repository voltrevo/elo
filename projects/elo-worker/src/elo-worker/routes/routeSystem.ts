import * as io from 'io-ts';
import reporter from 'io-ts-reporters';
import route from 'koa-route';
import uuid from 'uuid';

import backendApiSpec from '../../elo-types/backendApiSpec';
import AppComponents from '../AppComponents';

export type RouteResult<T> = (
  | { ok: T }
  | { status: number, body: unknown }
);

type Spec = typeof backendApiSpec;

export type RouteDefinition<Path extends keyof Spec> = (
  appComponents: AppComponents,
  body: io.TypeOf<Spec[Path]['Request']>,
) => Promise<RouteResult<io.TypeOf<Spec[Path]['Response']>>>;

export function attachRoute<Path extends keyof Spec>(
  path: Path,
  appComponents: AppComponents,
  routeDefinition: RouteDefinition<Path>,
) {
  const { koaApp } = appComponents;

  koaApp.use(route.post(`/${path}`, async ctx => {
    const decodeResult = backendApiSpec[path].Request.decode(ctx.request.body);

    if ('left' in decodeResult) {
      ctx.status = 400;
      const id = uuid.v4();
      console.error(id, reporter.report(decodeResult));
      ctx.body = { type: 'error', message: id };
      return;
    }

    const result = await routeDefinition(appComponents, decodeResult.right);

    if ('ok' in result) {
      ctx.status = 200;
      ctx.body = result.ok;
    } else {
      ctx.status = result.status;
      ctx.body = result.body;
    }
  }));
}
