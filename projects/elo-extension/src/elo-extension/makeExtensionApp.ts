import Browser from "webextension-polyfill";
import DeviceStorage from "../elo-extension-app/deviceStorage/DeviceStorage";
import ExtensionApp from "../elo-extension-app/ExtensionApp";
import ZoomBackendRpc from "../elo-extension-app/ZoomBackendRpc";
import BackendApi from "./BackendApi";
import config from "./config";
import GoogleAuthApi from "./GoogleAuthApi";
import makeStorageClient from "./makeStorageClient";

export default async function makeExtensionApp() {
  const apiBase = `${config.tls ? 'https:' : 'http:'}//${config.hostAndPort}`;

  const extensionApp = new ExtensionApp(
    new BackendApi(`${config.tls ? 'https:' : 'http:'}//${config.hostAndPort}`),
    new GoogleAuthApi(config.googleOauthClientId),
    Browser.runtime.getURL('elo-page.html'),
    await DeviceStorage.Create(Browser.storage.local, 'elo'),
    (eloLoginToken) => makeStorageClient(apiBase, eloLoginToken),
    (eloLoginToken) => ({
      zoom: new ZoomBackendRpc(`${apiBase}/zoom/rpc`, eloLoginToken),
    }),
  );

  return extensionApp;
}
