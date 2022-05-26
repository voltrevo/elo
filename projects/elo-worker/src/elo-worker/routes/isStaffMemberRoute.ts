import ErrorData from '../../common-pure/ErrorData';
import nil from '../../common-pure/nil';
import users from '../../database/queries/users';
import { RouteDefinition } from './routeSystem';

const isStaffMemberRoute: RouteDefinition<'isStaffMember'> = async (
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

  return { ok: staffEmail !== nil };
};

export default isStaffMemberRoute;
