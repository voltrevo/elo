import * as io from 'io-ts';
import ExplicitAny from '../common-pure/ExplicitAny';
import optional from '../elo-types/optional';

import storageBackendService from '../storage-backend/storageBackendService';
import zoomBackendService from '../zoom-backend/zoomBackendService';

const services = {
  [storageBackendService.name]: storageBackendService,
  [zoomBackendService.name]: zoomBackendService,
};

type Services = typeof services;

export type NamedServiceConfig = {
  [Name in keyof Services]: {
    name: Name,
    instanceName?: string,
    config: Services[Name]['Config'],
  }
}[keyof Services];

export const NamedServiceConfig: io.Type<NamedServiceConfig> = io.union(
  Object.values(services).map(
    ({ name, Config }) => io.type({
      name: io.literal(name),
      instanceName: optional(io.string),
      config: Config,
    }),
  ) as ExplicitAny,
);

export async function runService(nsc: NamedServiceConfig) {
  console.log('starting', nsc.instanceName ?? nsc.name);
  return await services[nsc.name].run(nsc.config as ExplicitAny);
}

export default services;
