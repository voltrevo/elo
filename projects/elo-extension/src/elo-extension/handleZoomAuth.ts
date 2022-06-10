import Browser from "webextension-polyfill";
import config from "./config";

export default async function handleZoomAuth() {
  const url = new URL(window.location.href);

  if (
    (
      url.origin === 'get-elo.com' ||
      url.origin.endsWith('.get-elo.com')
    ) &&
    url.pathname === '/zoom-oauth-redirect.html'
  ) {
    window.opener.postMessage(
      {
        zoomAuthCode: url.searchParams.get('code'),
      },
      new URL(Browser.runtime.getURL('/')).origin,
    );
  }
}
