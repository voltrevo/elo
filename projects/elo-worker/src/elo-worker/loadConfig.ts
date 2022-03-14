import fs from 'fs/promises';
import path from 'path';
import decode from '../elo-types/decode';

import Config from './Config';

export default async function loadConfig() {
  let configPath: string;

  if (process.env.CONFIG_PATH !== undefined) {
    configPath = path.resolve(process.cwd(), process.env.CONFIG_PATH);
  } else {
    configPath = require.resolve('../../../../config.json');
  }

  const configJson = JSON.parse(await fs.readFile(configPath, 'utf8'));

  return decode(Config, configJson);
}
