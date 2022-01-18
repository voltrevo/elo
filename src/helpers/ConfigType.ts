import * as io from 'io-ts';

export const ConfigType = io.type({
  server: io.type({
    pgConnString: io.string,
    host: io.string,
    port: io.number,
  }),
  client: io.type({
    tls: io.boolean,
    hostAndPort: io.string,
  }),
});

export type ConfigType = io.TypeOf<typeof ConfigType>;
