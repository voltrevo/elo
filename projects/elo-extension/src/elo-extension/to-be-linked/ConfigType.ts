import * as io from 'io-ts';
import ExtensionFeatureFlags from '../../elo-types/ExtensionFeatureFlags';

export const ConfigType = io.type({
  server: optional(io.type({
    pgConnString: io.string,
    host: io.string,
    port: io.number,
    https: optional(io.type({
      key: io.string,
      cert: io.string,
    })),
    userIdGenerationSecret: io.string,
    tokenEncryptionSecret: io.string,
  })),
  client: optional(io.type({
    tls: io.boolean,
    hostAndPort: io.string,
    sampleStorage: io.record(io.string, io.unknown),
    featureFlags: ExtensionFeatureFlags,
    googleOathClientId: io.string,
  })),
});

export type ConfigType = io.TypeOf<typeof ConfigType>;

function optional<Type extends io.Mixed>(type: Type) {
  return io.union([io.undefined, type]);
}
