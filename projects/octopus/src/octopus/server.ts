import 'source-map-support/register';

import loadConfig from './loadConfig';
import run from './run';

(async () => {
  await run(await loadConfig());
})().catch(console.error);
