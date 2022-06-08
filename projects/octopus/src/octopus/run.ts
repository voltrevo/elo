import Config from './Config';
import { runService } from './services';

export default async function run(config: Config) {
  console.log(config.startupMessage);
  await Promise.all(config.services.map(runService));
}
