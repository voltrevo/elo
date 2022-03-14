import backendApiSpec from '../../elo-types/backendApiSpec';
import generateIdRoute from './generateIdRoute';
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
  passwordHardeningSalt: passwordHardeningSaltRoute,
  register: registerRoute,
  startSession: startSessionRoute,

  // TODO
  login: () => { throw new Error('Not implemented'); },
};

export default allRouteDefinitions;
