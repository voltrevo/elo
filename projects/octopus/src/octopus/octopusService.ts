import Service from '../common-backend/Service';
import Config from './Config';
import run from './run';

const octopusService = Service({
  name: 'octopus',
  Config,

  // This wrapper is needed due to circular import
  run: (config: Config) => run(config),
});

export default octopusService;
