import launch from './helpers/launch';
import loadConfig from './loadConfig';
import run from './run';

launch(async () => {
  const config = await loadConfig();
  await run(config);
});
