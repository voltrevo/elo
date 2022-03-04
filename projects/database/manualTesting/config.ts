import * as io from 'io-ts';
import decode from '../src/elo-types/decode';

const configJson = require(process.env.CONFIG ?? '../../../manualTesting/config.json');

export const Config = io.type({
  pgConnString: io.string,
});

export type Config = io.TypeOf<typeof Config>;

const config = decode(Config, configJson);

export default config;
