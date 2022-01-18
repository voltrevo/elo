import * as io from 'io-ts';

export const ConfigType = io.type({
  server: io.type({
    db: io.type({
      host: io.string,
      dbname: io.string,
      port: io.number,
      password: io.string,
    }),
    port: io.number,
  }),
  client: io.type({
    tls: io.boolean,
    hostAndPort: io.string,
  }),
});

export type ConfigType = io.TypeOf<typeof ConfigType>;
