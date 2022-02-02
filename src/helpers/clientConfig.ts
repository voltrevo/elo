import config from './config';

function loadClientConfig() {
  if (config.client === undefined) {
    throw new Error('Missing client config');
  }

  return config.client;
}

export type ClientConfig = ReturnType<typeof loadClientConfig>;

export default loadClientConfig();
