import checkEmailVerification from '../checkEmailVerification';
import { RouteDefinition } from './routeSystem';

const checkVerificationEmailRoute: RouteDefinition<'checkVerificationEmail'> = async (
  { db },
  { email, code },
) => ({
  ok: {
    verified: await checkEmailVerification(db, email, code),
  },
});

export default checkVerificationEmailRoute;
