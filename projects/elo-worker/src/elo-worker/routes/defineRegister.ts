import fetch from 'node-fetch';

import route from 'koa-route';
import reporter from 'io-ts-reporters';
import AppComponents from '../AppComponents';
import { validateUserId } from '../userIds';
import Registration from '../../elo-types/Registration';
import never from '../../common-pure/never';
import { lookupEmailVerification } from '../../database/queries/emailVerification';
import { GoogleAuthResult } from '../../elo-types/GoogleAuthResult';

export default function defineRegister({
  koaApp, db, config,
}: AppComponents) {
  koaApp.use(route.post('/register', async ctx => {
    const decodeResult = Registration.decode(ctx.request.body);

    if ('left' in decodeResult) {
      ctx.status = 400;
      ctx.body = reporter.report(decodeResult);
      return;
    }

    // FIXME: Getting `any` from decodeResult.right
    const registration: Registration = decodeResult.right;
    const userId = registration.userId;

    if (userId !== undefined && !validateUserId(userId)) {
      ctx.status = 400;
      ctx.body = 'Invalid userId';
      return;
    }

    let email: string;
    let oauth_providers: string[];

    if ('code' in registration) {
      // Email verification
      const row = await lookupEmailVerification(db, registration.email);

      if (row === undefined || registration.code !== row.verification_code) {
        ctx.status = 401;
        ctx.body = 'Invalid verification code';
        return;
      }

      email = registration.email;
      oauth_providers = [];
    } else if ('googleAccessToken' in registration) {
      // Google verification
      const tokenInfoJson = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        headers: {
          Authorization: `Bearer ${registration.googleAccessToken}`,
        },
      }).then(res => res.json());

      const decodeResult = GoogleAuthResult.props.detail.decode(tokenInfoJson);

      if ('left' in decodeResult) {
        ctx.status = 500;
        ctx.body = 'Unexpected result from google auth';
        console.error(reporter.report(decodeResult).join('\n'));
        return;
      }

      // FIXME: Getting `any` from decodeResult.right
      const authDetail: GoogleAuthResult['detail'] = decodeResult.right;

      if (authDetail.expires_in <= 0) {
        ctx.status = 401;
        ctx.body = 'googleAccessToken expired';
        return;
      }

      if (authDetail.issued_to !== config.googleOauthClientId) {
        ctx.status = 401;
        ctx.body = 'googleAccessToken issued to wrong application';
        return;
      }

      email = authDetail.email;
      oauth_providers = ['google'];
    } else {
      never(registration);
    }

    email;

    // ctx.body = sessionTokenBicoder.encode({ userId });
  }));
}
