import * as io from 'io-ts';

export const ConfigType = io.type({
  server: io.type({
    pgConnString: io.string,
    host: io.string,
    port: io.number,
    https: io.union([
      io.undefined,
      io.type({
        key: io.string,
        cert: io.string,
      }),
    ]),
    userIdGenerationSecret: io.string,
  }),
  client: io.type({
    tls: io.boolean,
    hostAndPort: io.string,
  }),
});

export type ConfigType = io.TypeOf<typeof ConfigType>;
