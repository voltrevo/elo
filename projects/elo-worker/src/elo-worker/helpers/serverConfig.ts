import config from './config';

function loadServerConfig() {
  if (config.server === undefined) {
    throw new Error('Missing server config');
  }

  return config.server;
}

export type ServerConfig = ReturnType<typeof loadServerConfig>;

export default loadServerConfig();
