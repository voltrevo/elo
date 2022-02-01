import PostMessageClient from '../helpers/PostMessageClient';
import type ContentApp from './ContentApp';
import Protocol, { PromisifyApi } from './Protocol';

const methodSet: Record<keyof Protocol, true> = {
  notifyGetUserMediaCalled: true,
  addFragment: true,
  addConnectionEvent: true,
  getUiState: true,
  getDashboardUrl: true,
  getSessionToken: true,
};

export default function ContentAppClient(
  postMessageClient: PostMessageClient,
): PromisifyApi<Protocol> {
  const api = {} as any;

  for (const method of Object.keys(methodSet)) {
    api[method] = (...args: unknown[]) => postMessageClient.post({ method, args });
  }

  return api;
}

export function makeLocalContentAppClient(contentApp: ContentApp): PromisifyApi<Protocol> {
  const api = {} as any;

  for (const method of Object.keys(methodSet)) {
    api[method] = async (...args: unknown[]) => (contentApp as any)[method](...args);
  }

  return api;
}
