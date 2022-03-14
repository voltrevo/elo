import backendApiSpec from '../../elo-types/backendApiSpec';
import generateIdRoute from './generateIdRoute';
import loginRoute from './loginRoute';
import passwordHardeningSaltRoute from './passwordHardeningSaltRoute';
import registerRoute from './registerRoute';
import { RouteDefinition } from './routeSystem';
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
};

export default allRouteDefinitions;
