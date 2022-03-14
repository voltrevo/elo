import type { Config } from '../src/elo-worker/helpers/config';

const testConfig: Config = {
  pgConnString: 'pgconnstring',
  host: '0.0.0.0',
  port: 12345,
  https: undefined,
  userIdGenerationSecret: 'userIdGenerationSecret',
  tokenEncryptionSecret: 'tokenEncryptionSecret',
  googleOauthClientId: 'googleOauthClientId',
};

export default testConfig;
