import Browser from "webextension-polyfill";

export default async function handleZoomExternalCapture() {
  const isZoomDesktopLauncher = (
    (location.host === 'zoom.us' || location.host.endsWith('.zoom.us')) &&
    (
      location.pathname.startsWith('/j/') ||
      location.pathname.startsWith('/s/')
    )
  );

  if (!isZoomDesktopLauncher) {
    return;
  }

  Browser.runtime.sendMessage('zoom-might-start');
}
