import nil from "../common-pure/nil";
import StorageClient from "../storage-client/StorageClient";
import StorageKeyCalculator from "../storage-client/StorageKeyCalculator";
import StorageRpcClient from "../storage-client/StorageRpcClient";

export default async function makeStorageClient(apiBase: string, eloLoginToken: string) {
  const rpcClient = new StorageRpcClient(
    `${apiBase}/storage/rpc`,
    eloLoginToken,
  );

  const keyCalculator = await StorageKeyCalculator.Create(rpcClient, nil);

  return new StorageClient(rpcClient, keyCalculator);
}
