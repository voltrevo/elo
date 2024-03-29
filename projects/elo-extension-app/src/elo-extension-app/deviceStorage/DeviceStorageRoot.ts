import * as io from 'io-ts';

import optional from '../../elo-types/optional';
import deviceStorageVersion from './deviceStorageVersion';

const DeviceStorageRoot = io.type({
  installTriggered: optional(io.literal(true)),
  accountRoot: optional(io.string),
  storageVersion: optional(io.number),
});

type DeviceStorageRoot = io.TypeOf<typeof DeviceStorageRoot>;

export function initStorageRoot(): DeviceStorageRoot {
  return {
    installTriggered: undefined,
    accountRoot: undefined,
    storageVersion: deviceStorageVersion,
  };
}

export default DeviceStorageRoot;
