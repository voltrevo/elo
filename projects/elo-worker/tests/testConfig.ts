import type { Config } from '../src/elo-worker/Config';

const testConfig: Config = {
  pgConnString: 'pgconnstring',
  host: '0.0.0.0',
  port: 12345,
  https: undefined,
  secrets: {
    userIdGeneration: 'userIdGenerationSecret',
    tokenEncryption: 'tokenEncryptionSecret',
    passwordHardening: 'passwordHardeningSecret',
  },
  googleOauthClientId: 'googleOauthClientId',
};

export default testConfig;
