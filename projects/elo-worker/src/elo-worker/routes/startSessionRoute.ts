import ErrorData from '../../common-pure/ErrorData';
import { incSession, incUserSessionsStarted } from '../../database/queries/stats';
import { validateUserId } from '../userIds';
import { RouteDefinition } from './routeSystem';

const startSessionRoute: RouteDefinition<'startSession'> = async (
  {
    db,
    config,
    sessionTokenBicoder,
    loginTokenBicoder,
  },
  request,
) => {
  incSession(db);

  let userId: string | undefined;

  if ('eloLoginToken' in request) {
    const decodeResult = loginTokenBicoder.decode(request.eloLoginToken);

    if (decodeResult instanceof ErrorData) {
      console.log('eloLoginToken decode failed:', decodeResult.detail);

      return {
        status: 401,
        body: 'Unauthorized',
      };
    }

    userId = decodeResult.userId;
  } else {
    // DEPRECATED: Supplying direct userId or neglecting entirely.
    // TODO: Measure usage and remove when reasonable.

    userId = request.userId;

    if (typeof userId !== 'string') {
      return { ok: '' };
    }
  }

  if (!validateUserId(config.secrets.userIdGeneration, userId)) {
    return {
      status: 400,
      body: 'Invalid userId',
    };
  }

  incUserSessionsStarted(db, userId);

  return {
    ok: sessionTokenBicoder.encode({ userId }),
  };
};

export default startSessionRoute;
