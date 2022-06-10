import Browser from "webextension-polyfill";
import nil from "../common-pure/nil";
import ExtensionApp from "../elo-extension-app/ExtensionApp";
import DeviceStorage from '../elo-extension-app/deviceStorage/DeviceStorage';
import BackendApi from "./BackendApi";
import config from "./config";
import GoogleAuthApi from "./GoogleAuthApi";
import makeStorageClient from "./makeStorageClient";
import ZoomBackendRpc from "../elo-extension-app/ZoomBackendRpc";

(async () => {
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

  const settings = await extensionApp.readSettings();

  const parsedLocation = new URL(location.href);
  const inviteUrl = new URL(parsedLocation.searchParams.get('inviteUrl') ?? '');

  if (settings === nil) {
    console.error('Account root missing');
    return;
  }

  if (settings.zoomRedirectToWebClient === false) {
    inviteUrl.searchParams.set('disableEloRedirect', 'true');
    location.href = inviteUrl.href;
    return;
  }

  const meetingId = inviteUrl.pathname.replace('/j/', '');

  const redirectUrl = new URL(inviteUrl.href);
  redirectUrl.pathname = `/wc/join/${meetingId}`;
  redirectUrl.searchParams.set('isEloRedirect', 'true');

  location.href = redirectUrl.toString();
})().catch(console.error);
