import PostMessageClient from "../helpers/PostMessageClient";
import Protocol, { PromisifyApi } from "./Protocol";

const methodSet: Record<keyof Protocol, true> = {
  notifyGetUserMediaCalled: true,
  addFragment: true,
  addConnectionEvent: true,
  getUiState: true,
  getDashboardUrl: true,
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
