import never from '../../common-pure/never';
import users from '../../database/queries/users';
import fetchGoogleTokenInfo from '../fetchGoogleTokenInfo';
import hashPassword from '../hashPassword';
import { RouteDefinition } from './routeSystem';

const loginRoute: RouteDefinition<'login'> = async (
  { db, config, loginTokenBicoder },
  loginCredentials,
) => {
  if ('email' in loginCredentials) {
    const existingUser = await users.lookup(db, { email: loginCredentials.email });

    const success = (
      existingUser &&
      hashPassword(
        loginCredentials.hardenedPassword,
        existingUser.password_salt,
      ) === existingUser.password_hash
    );

    if (!success) {
      return {
        status: 401,

        // Note that we don't specify whether the user exists or indeed whether
        // the user has a password. Unauthenticated users are not allowed to
        // acquire that information.
        body: 'Incorrect password',
      };
    }

    return {
      ok: {
        eloLoginToken: loginTokenBicoder.encode({
          type: 'elo-login',
          userId: existingUser.id,
        }),
        userId: existingUser.id,
        email: loginCredentials.email,
        googleAccount: undefined,
      },
    };
  }

  if ('googleAccessToken' in loginCredentials) {
    const tokenInfo = await fetchGoogleTokenInfo(
      loginCredentials.googleAccessToken,
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

    const existingUser = await users.lookup(db, { email: tokenInfo.email });

    if (!existingUser) {
      return {
        status: 404,

        // It's ok to provide this information because the user has a valid
        // google token for this email.
        body: 'Account does not exist',
      };
    }

    if (!existingUser.oauth_providers.includes('google')) {
      return {
        status: 401,
        body: 'Account exists but does not allow google login #wrong-auth',
      };
    }

    return {
      ok: {
        eloLoginToken: loginTokenBicoder.encode({
          type: 'elo-login',
          userId: existingUser.id,
        }),
        userId: existingUser.id,
        email: tokenInfo.email,
        googleAccount: tokenInfo.email,
      },
    };
  }

  never(loginCredentials);
};

export default loginRoute;
