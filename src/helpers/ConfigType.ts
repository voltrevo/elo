import * as io from 'io-ts';

export const ConfigType = io.type({
  db: io.type({
    host: io.string,
    dbname: io.string,
    port: io.number,
    password: io.string,
  }),
  api: io.type({
    tls: io.boolean,
    host: io.string,
    port: io.number,
  }),
});

export type ConfigType = io.TypeOf<typeof ConfigType>;
