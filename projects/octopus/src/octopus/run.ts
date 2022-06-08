import runForever from '../common-backend/runForever';
import check from './check';
import Config from './Config';
import { runService } from './services';

export default async function run(config: Config, checked?: boolean) {
  console.log(config.startupMessage);

  if (!checked) {
    await check(config);
  }

  await Promise.all(config.services.map(runService));

  if (config.runForever) {
    setInterval(() => {}, 1000);
    return await runForever();
  }
}
