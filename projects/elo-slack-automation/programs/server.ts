import 'source-map-support/register';

import loadConfig from '../src/elo-slack-automation/loadConfig';
import run from '../src/elo-slack-automation/run';

(async () => {
  const config = await loadConfig();
  await run(config);
})().catch(console.error);
