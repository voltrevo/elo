import { ConfigType } from '../src/helpers/ConfigType';

const testConfig: ConfigType = {
  server: {
    pgConnString: 'pgconnstring',
    host: '0.0.0.0',
    port: 12345,
    https: undefined,
    userIdGenerationSecret: 'userIdGenerationSecret',
    tokenEncryptionSecret: 'tokenEncryptionSecret',
  },
  client: {
    tls: true,
    hostAndPort: 'localhost:12345',
  },
};

export default testConfig;
