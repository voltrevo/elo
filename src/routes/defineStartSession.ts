import * as io from 'io-ts';

import route from 'koa-route';
import reporter from 'io-ts-reporters';
import AppComponents from '../AppComponents';

const StartSessionBody = io.type({
  userId: io.string,
});

export default function defineStartSession({ koaApp, db, sessionTokenBicoder }: AppComponents) {
  koaApp.use(route.post('/startSession', async ctx => {
    const decodeResult = StartSessionBody.decode(ctx.request.body);

    if ('left' in decodeResult) {
      ctx.status = 400;
      ctx.body = reporter.report(decodeResult);
      return;
    }

    db.incSession();

    const { userId } = decodeResult.right;
    db.incUserSessionsStarted(userId);

    return sessionTokenBicoder.encode({ userId });
  }));
}
