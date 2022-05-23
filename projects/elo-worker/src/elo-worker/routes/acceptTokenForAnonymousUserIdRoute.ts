import ErrorData from '../../common-pure/ErrorData';
import tokenGrantableUserIds from '../../database/queries/tokenGrantableUserIds';
import { RouteDefinition } from './routeSystem';

const acceptTokenForAnonymousUserIdRoute: RouteDefinition<'acceptTokenForAnonymousUserId'> = async (
  { db, loginTokenBicoder },
  { eloLoginToken },
) => {
  const decodeResult = loginTokenBicoder.decode(eloLoginToken);

  if (decodeResult instanceof ErrorData) {
    console.log('eloLoginToken decode failed:', decodeResult.detail);

    return {
      status: 401,
      body: 'Unauthorized',
    };
  }

  tokenGrantableUserIds.setGranted(db, decodeResult.userId, true);

  return { ok: {} };
};

export default acceptTokenForAnonymousUserIdRoute;
