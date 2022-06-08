import Service from '../common-backend/Service';
import Config from './Config';
import run from './run';

export default Service({
  name: 'zoom-backend',
  Config,
  run,
});
