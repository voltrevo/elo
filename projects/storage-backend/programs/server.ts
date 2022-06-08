import 'source-map-support/register';

import loadConfig from '../src/storage-backend/loadConfig';
import run from '../src/storage-backend/run';

run(loadConfig());
