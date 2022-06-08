import assert from '../common-pure/assert';
import ExplicitAny from '../common-pure/ExplicitAny';
import eloSlackAutomationService from '../elo-slack-automation/eloSlackAutomationService';
import decode from '../elo-types/decode';
import eloWorkerService from '../elo-worker/eloWorkerService';
import storageBackendService from '../storage-backend/storageBackendService';
import zoomBackendService from '../zoom-backend/zoomBackendService';
import octopusService from './octopusService';

const services = {
  [storageBackendService.name]: storageBackendService,
  [zoomBackendService.name]: zoomBackendService,
  [octopusService.name]: octopusService,
  [eloSlackAutomationService.name]: eloSlackAutomationService,
  [eloWorkerService.name]: eloWorkerService,
};

type Services = typeof services;

export type NamedServiceConfig = {
  name: string,
  instanceName?: string,
  config: unknown,
};

export async function checkService(nsc: NamedServiceConfig) {
  console.log('checking', nsc.instanceName ?? nsc.name);
  assert(Object.keys(services).includes(nsc.name));
  const name = nsc.name as keyof Services;
  const config = decode(services[name].Config, nsc.config);
  console.log('  ✅ config');

  const check = services[name].check;

  if (check) {
    await check(config as ExplicitAny);
    console.log('  ✅ checked');
  }
}

export async function runService(nsc: NamedServiceConfig) {
  console.log('running', nsc.instanceName ?? nsc.name);

  return await services[nsc.name as keyof Services].run(
    nsc.config as ExplicitAny,
  );
}

export default services;
