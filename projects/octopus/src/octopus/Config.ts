import * as io from 'io-ts';

export const Config = io.type({
  startupMessage: io.string,
  services: io.array(io.literal('todo: service types')),
});

export type Config = io.TypeOf<typeof Config>;

export default Config;
