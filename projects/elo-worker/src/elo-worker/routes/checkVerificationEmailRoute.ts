import { lookupEmailVerification } from '../../database/queries/emailVerification';
import { RouteDefinition } from './routeSystem';

const checkVerificationEmailRoute: RouteDefinition<'checkVerificationEmail'> = async (
  { db },
  { email, code },
) => {
  const row = await lookupEmailVerification(db, email);

  if (
    !row ||
    Date.now() > row.expires.getTime()
  ) {
    return {
      ok: { verified: false },
    };
  }

  return {
    ok: {
      verified: code === row.verification_code,
    },
  };
};

export default checkVerificationEmailRoute;
