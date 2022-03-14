import fs from 'fs';

import * as io from 'io-ts';
import reporter from 'io-ts-reporters';
import optional from '../../elo-types/optional';

export const Config = io.type({
  pgConnString: io.string,
  host: io.string,
  port: io.number,
  https: optional(io.type({
    key: io.string,
    cert: io.string,
  })),
  userIdGenerationSecret: io.string,
  tokenEncryptionSecret: io.string,
  googleOauthClientId: io.string,
});

export type Config = io.TypeOf<typeof Config>;

const configPath = process.env.CONFIG_PATH ?? 'config.json';

const configJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const decodeResult = Config.decode(configJson);

if ('left' in decodeResult) {
  throw new Error(reporter.report(decodeResult).join('\n'));
}

const result: Config = decodeResult.right;

// TODO: Export a function to load the config instead
export default result;
