import { generateUserId } from '../userIds';
import { RouteDefinition } from './routeSystem';

const generateIdRoute: RouteDefinition<'generateId'> = async ({ config }) => ({
  ok: generateUserId(config.secrets.userIdGeneration, undefined),
});

export default generateIdRoute;
