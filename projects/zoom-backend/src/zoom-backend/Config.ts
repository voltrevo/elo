import * as io from 'io-ts';

export const Config = io.type({
  host: io.string,
  port: io.number,
});

export type Config = io.TypeOf<typeof Config>;

export default Config;
