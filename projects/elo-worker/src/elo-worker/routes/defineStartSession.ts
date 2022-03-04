import * as io from 'io-ts';

import route from 'koa-route';
import reporter from 'io-ts-reporters';
import AppComponents from '../AppComponents';
import { validateUserId } from '../userIds';
import { incSession, incUserSessionsStarted } from '../../database/queries/stats';

const StartSessionBody = io.type({
  userId: io.union([io.undefined, io.string]),
});

export default function defineStartSession({ koaApp, db, sessionTokenBicoder }: AppComponents) {
  koaApp.use(route.post('/startSession', async ctx => {
    const decodeResult = StartSessionBody.decode(ctx.request.body);

    if ('left' in decodeResult) {
      ctx.status = 400;
      ctx.body = reporter.report(decodeResult);
      return;
    }

    incSession(db);

    const { userId } = decodeResult.right;

    if (userId === undefined) {
      // DEPRECATED: Not including userId.
      // TODO: Measure usage and remove when reasonable.
      ctx.status = 200;
      return;
    }

    if (!validateUserId(userId)) {
      ctx.status = 400;
      ctx.body = 'Invalid userId';
      return;
    }

    incUserSessionsStarted(db, userId);
    ctx.body = sessionTokenBicoder.encode({ userId });
  }));
}
