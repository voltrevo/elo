import * as io from 'io-ts';
import reporter from 'io-ts-reporters';
import ExtensionFeatureFlags from '../elo-types/ExtensionFeatureFlags';
import optional from '../elo-types/optional';

const configJson = require("../../../../config.json");

export const Config = io.type({
  tls: io.boolean,
  hostAndPort: io.string,
  featureFlags: ExtensionFeatureFlags,
  googleOauthClientId: io.string,
  upgradePrompt: optional(io.type({
    enabled: io.boolean,
    version: io.string,
  })),
});

export type Config = io.TypeOf<typeof Config>;

const decodeResult = Config.decode(configJson);

if ('left' in decodeResult) {
  throw new Error(reporter.report(decodeResult).join('\n'));
}

if (decodeResult.right === undefined) {
  throw new Error('Missing client config');
}

export const config = decodeResult.right;

export default config;
