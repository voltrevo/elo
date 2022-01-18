import fs from 'fs';

import { ConfigType } from './ConfigType';

const configPath = process.env.CONFIG_PATH ?? 'config.json';

const configJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const decodeResult = ConfigType.decode(configJson);

if ('left' in decodeResult) {
  throw new Error(decodeResult.left.map(e => e.message ?? '').join('\n'));
}

export default decodeResult.right;
