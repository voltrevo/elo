import PostMessageClient from './helpers/PostMessageClient';
import { PromisifyApi, PromisishApi } from './helpers/protocolHelpers';
import Protocol, { protocolKeyMap } from './Protocol';

export default function ExtensionAppClient(
  postMessageClient: PostMessageClient,
): PromisifyApi<Protocol> {
  const api = {} as any;

  for (const method of Object.keys(protocolKeyMap)) {
    api[method] = (...args: unknown[]) => postMessageClient.post({ method, args });
  }

  return api;
}

export function makeLocalExtensionAppClient(contentApp: PromisishApi<Protocol>): PromisifyApi<Protocol> {
  const api = {} as any;

  for (const method of Object.keys(protocolKeyMap)) {
    api[method] = async (...args: unknown[]) => (contentApp as any)[method](...args);
  }

  return api;
}
