import Browser from "webextension-polyfill";
import ExtensionApp from "../elo-extension-app/ExtensionApp";

export default function handleZoomExternalCapture(extensionApp: ExtensionApp) {
  const isZoomDesktopLauncher = (
    (location.host === 'zoom.us' || location.host.endsWith('.zoom.us')) &&
    location.pathname.startsWith('/j/')
  );

  if (!isZoomDesktopLauncher) {
    return;
  }

  window.open(
    Browser.runtime.getURL('/zoom-external-capture.html'),
    undefined,
    [
      'width=300',
      'height=100',
      `left=${screen.availWidth - 400}`,
      'top=100',
    ].join(',')
  );
}
