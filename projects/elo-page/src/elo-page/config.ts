import * as io from 'io-ts';
import reporter from 'io-ts-reporters';
import ExtensionFeatureFlags from '../elo-types/ExtensionFeatureFlags';

const configJson = require("../../../../config.json");

export const Config = io.type({
  sampleStorage: io.record(io.string, io.unknown),
  featureFlags: ExtensionFeatureFlags,
  googleOathClientId: io.string,
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
