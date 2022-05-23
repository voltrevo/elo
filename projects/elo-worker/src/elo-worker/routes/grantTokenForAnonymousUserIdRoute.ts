import nil from '../../common-pure/nil';
import tokenGrantableUserIds from '../../database/queries/tokenGrantableUserIds';
import { RouteDefinition } from './routeSystem';

const grantTokenForAnonymousUserIdRoute: RouteDefinition<'grantTokenForAnonymousUserId'> = async (
  { db, loginTokenBicoder },
  { userId },
) => {
  const grantable = await tokenGrantableUserIds.lookup(db, userId);

  if (grantable === nil || grantable.granted) {
    return {
      status: 401,
      body: 'Unauthorized',
    };
  }

  return {
    ok: {
      eloLoginToken: loginTokenBicoder.encode({
        type: 'elo-login',
        userId,
      }),
    },
  };
};

export default grantTokenForAnonymousUserIdRoute;
