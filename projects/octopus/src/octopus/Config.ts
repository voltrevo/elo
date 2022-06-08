import * as io from 'io-ts';

import { NamedServiceConfig } from './services';

export const Config = io.type({
  startupMessage: io.string,
  services: io.array(NamedServiceConfig),
});

export type Config = io.TypeOf<typeof Config>;

export default Config;
