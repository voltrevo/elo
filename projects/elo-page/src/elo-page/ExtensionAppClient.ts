import Protocol, { protocolKeyMap, protocolThirdPartyKeyMap, ThirdPartyProtocol } from '../elo-extension-app/Protocol';
import { PromisifyApi, PromisishApi } from '../elo-extension-app/protocolHelpers';
import PostMessageClient from './helpers/PostMessageClient';

export default function ExtensionAppClient(
  postMessageClient: PostMessageClient,
): PromisifyApi<Protocol> {
  const api = {} as any;

  for (const method of Object.keys(protocolKeyMap)) {
    api[method] = (...args: unknown[]) => postMessageClient.post({ method, args });
  }

  return api;
}

export function ThirdPartyExtensionAppClient(
  postMessageClient: PostMessageClient,
): PromisifyApi<ThirdPartyProtocol> {
  const api = {} as any;

  for (const method of Object.keys(protocolThirdPartyKeyMap)) {
    api[method] = (...args: unknown[]) => postMessageClient.post({ method, args });
  }

  return api;
}

export function makeLocalExtensionAppClient(extensionApp: PromisishApi<Protocol>): PromisifyApi<Protocol> {
  const api = {} as any;

  for (const method of Object.keys(protocolKeyMap)) {
    api[method] = async (...args: unknown[]) => (extensionApp as any)[method](...args);
  }

  return api;
}
