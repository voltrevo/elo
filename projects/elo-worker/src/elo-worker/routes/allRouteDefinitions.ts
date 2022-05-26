import backendApiSpec from '../../elo-types/backendApiSpec';
import acceptTokenForAnonymousUserIdRoute from './acceptTokenForAnonymousUserIdRoute';
import checkVerificationEmailRoute from './checkVerificationEmailRoute';
import grantTokenForAnonymousUserIdRoute from './grantTokenForAnonymousUserIdRoute';
import isStaffMemberRoute from './isStaffMemberRoute';
import loginRoute from './loginRoute';
import monthlyStatsRoute from './monthlyStatsRoute';
import passwordHardeningSaltRoute from './passwordHardeningSaltRoute';
import registerRoute from './registerRoute';
import { RouteDefinition } from './routeSystem';
import sendVerificationEmailRoute from './sendVerificationEmailRoute';
import startSessionRoute from './startSessionRoute';

type Spec = typeof backendApiSpec;

type WorkerPaths = Exclude<keyof Spec, 'feedback'>;

const allRouteDefinitions: {
  [Path in WorkerPaths]: RouteDefinition<Path>
} = {
  login: loginRoute,
  passwordHardeningSalt: passwordHardeningSaltRoute,
  register: registerRoute,
  startSession: startSessionRoute,
  sendVerificationEmail: sendVerificationEmailRoute,
  checkVerificationEmail: checkVerificationEmailRoute,
  grantTokenForAnonymousUserId: grantTokenForAnonymousUserIdRoute,
  acceptTokenForAnonymousUserId: acceptTokenForAnonymousUserIdRoute,
  monthlyStats: monthlyStatsRoute,
  isStaffMember: isStaffMemberRoute,
};

export default allRouteDefinitions;
