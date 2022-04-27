import * as io from 'io-ts';

const Config = io.type({
  port: io.number,
  pgConnString: io.string,
  userRowLimit: 50,
  secrets: io.type({
    tokenEncryption: io.string,
  }),
});

type Config = io.TypeOf<typeof Config>;

export default Config;
