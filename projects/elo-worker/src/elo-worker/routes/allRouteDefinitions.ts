import backendApiSpec from '../../elo-types/backendApiSpec';
import checkVerificationEmailRoute from './checkVerificationEmailRoute';
import generateIdRoute from './generateIdRoute';
import loginRoute from './loginRoute';
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
  generateId: generateIdRoute,
  login: loginRoute,
  passwordHardeningSalt: passwordHardeningSaltRoute,
  register: registerRoute,
  startSession: startSessionRoute,
  sendVerificationEmail: sendVerificationEmailRoute,
  checkVerificationEmail: checkVerificationEmailRoute,
};

export default allRouteDefinitions;
