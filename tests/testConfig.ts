import type { ServerConfig } from '../src/helpers/serverConfig';

const testConfig: ServerConfig = {
  pgConnString: 'pgconnstring',
  host: '0.0.0.0',
  port: 12345,
  https: undefined,
  userIdGenerationSecret: 'userIdGenerationSecret',
  tokenEncryptionSecret: 'tokenEncryptionSecret',
};

export default testConfig;
