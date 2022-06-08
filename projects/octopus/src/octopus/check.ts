import Config from './Config';
import { checkService } from './services';

export default async function check(config: Config) {
  await Promise.all(config.services.map(checkService));
}
