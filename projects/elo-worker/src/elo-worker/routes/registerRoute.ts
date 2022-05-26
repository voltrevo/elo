import crypto from 'crypto';

import base58 from '../../common-pure/base58';
import never from '../../common-pure/never';
import users from '../../database/queries/users';
import checkEmailVerification from '../checkEmailVerification';
import fetchGoogleTokenInfo from '../fetchGoogleTokenInfo';
import hashPassword from '../hashPassword';
import { generateUserId, validateUserId } from '../userIds';
import { RouteDefinition } from './routeSystem';

const registerRoute: RouteDefinition<'register'> = async (
  { db, config, loginTokenBicoder },
  registration,
) => {
  const userIdHint = registration.userIdHint;

  if (
    userIdHint !== undefined &&
    !validateUserId(config.secrets.userIdGeneration, userIdHint)
  ) {
    return {
      status: 400,
      body: 'Invalid userId',
    };
  }

  let email: string;
  let oauth_providers: string[];
  let googleAccount: string | null;

  if ('code' in registration) {
    // Email verification
    if (!await checkEmailVerification(
      db,
      registration.email,
      registration.code,
    )) {
      return {
        status: 401,
        body: 'Invalid verification code',
      };
    }

    email = registration.email;
    oauth_providers = [];
    googleAccount = null;
  } else if ('googleAccessToken' in registration) {
    const tokenInfo = await fetchGoogleTokenInfo(
      registration.googleAccessToken,
    );

    if (tokenInfo.expires_in <= 0) {
      return {
        status: 401,
        body: 'googleAccessToken expired',
      };
    }

    if (tokenInfo.issued_to !== config.googleOauthClientId) {
      return {
        status: 401,
        body: 'googleAccessToken issued to wrong application',
      };
    }

    email = tokenInfo.email;
    oauth_providers = ['google'];
    googleAccount = email;
  } else {
    never(registration);
  }

  const userId = (
    userIdHint ??
    generateUserId(config.secrets.userIdGeneration, email)
  );

  const password_salt = base58.encode(crypto.randomBytes(16));

  const password_hash = 'hardenedPassword' in registration
    ? hashPassword(registration.hardenedPassword, password_salt)
    : null;

  try {
    await users.insert(db, {
      id: userId,
      email,
      password_hash,
      password_salt,
      oauth_providers,
    });
  } catch (error) {
    const existingUser = (
      await users.lookup(db, { email }) ??
      (userIdHint && await users.lookup(db, { id: userIdHint }))
    );

    if (existingUser) {
      return {
        status: 409,

        // It's important to avoid revealing this publicly, but it's reasonable
        // here because the user has authenticated their email.
        body: 'Account already exists',
      };
    }

    throw error;
  }

  return {
    ok: {
      eloLoginToken: loginTokenBicoder.encode({
        type: 'elo-login',
        userId,
      }),
      userId,
      email,
      googleAccount: googleAccount ?? undefined,
    },
  };
};

export default registerRoute;
