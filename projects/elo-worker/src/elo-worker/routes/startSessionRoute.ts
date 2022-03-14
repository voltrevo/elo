import { incSession, incUserSessionsStarted } from '../../database/queries/stats';
import { validateUserId } from '../userIds';
import { RouteDefinition } from './routeSystem';

const startSessionRoute: RouteDefinition<'startSession'> = async (
  { db, config, sessionTokenBicoder },
  { userId },
) => {
  incSession(db);

  if (userId === undefined) {
    // DEPRECATED: Not including userId.
    // TODO: Measure usage and remove when reasonable.
    return { ok: '' };
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
