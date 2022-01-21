import fs from 'fs';

import reporter from 'io-ts-reporters';

import { ConfigType } from './ConfigType';

const configPath = process.env.CONFIG_PATH ?? 'config.json';

const configJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const decodeResult = ConfigType.decode(configJson);

if ('left' in decodeResult) {
  throw new Error(reporter.report(decodeResult).join('\n'));
}

export default decodeResult.right;