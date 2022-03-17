import route from 'koa-route';

import AppComponents from '../AppComponents';
import UnsubscribeCode from '../UnsubscribeCode';

export default function defineAnalyze(appComponents: AppComponents) {
  const { koaApp, config } = appComponents;

  koaApp.use(route.get('/unsubscribe', async ctx => {
    const { email, code } = ctx.query;

    if (typeof email !== 'string' || typeof code !== 'string') {
      ctx.status = 400;
      ctx.body = 'Invalid parameters';
      return;
    }

    const correctCode = UnsubscribeCode(
      config.secrets.emailUnsubscribeCodes,
      email,
    );

    if (code !== correctCode) {
      ctx.status = 401;
      ctx.body = 'Unauthorized';
      return;
    }

    ctx.status = 200;
    ctx.headers['content-type'] = 'text/html; charset=UTF-8';
    ctx.body = [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '<title>Unsubscribed</title>',
      '</head>',
      '<body>',
      ...[
        '<h1>Unsubscribed</h1>',
        [
          '<p>',
          `${email} has been successfully unsubscribed. This should prevent`,
          'all future emails that would otherwise be sent to this address.',
          '</p>',
        ].join(''),
        [
          '<p>',
          'If you ever need to reverse this action (eg to set up an account),',
          'please <a href="https://get-elo.com/contact/">get in touch</a>.',
          '</p>',
        ].join(''),
      ].join('\n'),
      '</body>',
      '</html>',
    ].join('\n');
  }));
}
