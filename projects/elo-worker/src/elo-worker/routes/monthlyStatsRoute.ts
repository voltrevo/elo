import ErrorData from '../../common-pure/ErrorData';
import nil from '../../common-pure/nil';
import monthlyStats from '../../database/queries/monthlyStats';
import users from '../../database/queries/users';
import { RouteDefinition } from './routeSystem';

const monthlyStatsRoute: RouteDefinition<'monthlyStats'> = async (
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

  const userId = decodeResult.userId;
  const staffEmail = await users.lookupStaffEmail(db, userId);

  if (staffEmail === nil) {
    return {
      status: 403,
      body: 'Forbidden',
    };
  }

  const results = (await monthlyStats.get(db)).map(r => ({
    month: r.month,
    activeUsers: r.active_users,
    spokenHours: r.spoken_hours,
    streamedHours: r.streamed_hours,
    sessions: r.sessions,
  }));

  return { ok: results };
};

export default monthlyStatsRoute;
