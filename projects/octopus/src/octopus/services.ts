import assert from '../common-pure/assert';
import ExplicitAny from '../common-pure/ExplicitAny';
import storageBackendService from '../storage-backend/storageBackendService';
import zoomBackendService from '../zoom-backend/zoomBackendService';
import octopusService from './octopusService';

const services = {
  [storageBackendService.name]: storageBackendService,
  [zoomBackendService.name]: zoomBackendService,
  [octopusService.name]: octopusService,
};

type Services = typeof services;

export type NamedServiceConfig = {
  name: string,
  instanceName?: string,
  config: unknown,
};

export async function runService(nsc: NamedServiceConfig) {
  console.log('running', nsc.instanceName ?? nsc.name);
  assert(Object.keys(services).includes(nsc.name));
  const name = nsc.name as keyof Services;
  assert(services[name].Config.is(nsc.config));
  console.log('  ✅ config');

  return await services[name].run(nsc.config as ExplicitAny);
}

export default services;
