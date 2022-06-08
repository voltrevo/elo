import Service from '../common-backend/Service';
import check from './check';
import Config from './Config';
import run from './run';

const octopusService = Service({
  name: 'octopus',
  Config,

  // These wrappers are needed due to circular import
  check: (config: Config) => check(config),
  run: (config: Config) => run(config),
});

export default octopusService;
