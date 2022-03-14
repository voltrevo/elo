import crypto from 'crypto';

import fetch from 'node-fetch';

import route from 'koa-route';
import reporter from 'io-ts-reporters';
import { keccak256 } from 'js-sha3';
import AppComponents from '../AppComponents';
import { generateUserId, validateUserId } from '../userIds';
import Registration from '../../elo-types/Registration';
import never from '../../common-pure/never';
import { lookupEmailVerification } from '../../database/queries/emailVerification';
import { GoogleAuthResult } from '../../elo-types/GoogleAuthResult';
import { insertUser, lookupUser } from '../../database/queries/users';
import base58 from '../../common-pure/base58';

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
    const userIdHint = registration.userIdHint;

    if (
      userIdHint !== undefined &&
      !validateUserId(config.userIdGenerationSecret, userIdHint)
    ) {
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

      const tokenDecodeResult = GoogleAuthResult.props.detail.decode(
        tokenInfoJson,
      );

      if ('left' in tokenDecodeResult) {
        ctx.status = 500;
        ctx.body = 'Unexpected result from google auth';
        console.error(reporter.report(tokenDecodeResult).join('\n'));
        return;
      }

      // FIXME: Getting `any` from decodeResult.right
      const authDetail: GoogleAuthResult['detail'] = tokenDecodeResult.right;

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

    const userId = (
      userIdHint ??
      generateUserId(config.userIdGenerationSecret, email)
    );

    const password_salt = base58.encode(crypto.randomBytes(16));

    const password_hash = 'hardenedPassword' in registration
      ? keccak256(`${registration.hardenedPassword}:${password_salt}`)
      : undefined;

    try {
      await insertUser(db, {
        id: userId,
        email,
        password_hash,
        password_salt,
        oauth_providers,
      });
    } catch (error) {
      const existingUser = (
        await lookupUser(db, { email }) ??
        (userIdHint && await lookupUser(db, { id: userIdHint }))
      );

      if (existingUser) {
        ctx.status = 409;
        // It's important to avoid revealing this publicly, but it's reasonable
        // here because the user has authenticated their email.
        ctx.body = 'Account already exists';
        return;
      }

      throw error;
    }

    ctx.status = 200;
    ctx.body = 'Success';
  }));
}
