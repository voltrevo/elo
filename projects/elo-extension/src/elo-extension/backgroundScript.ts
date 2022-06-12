import Browser from 'webextension-polyfill';

import assert from '../common-pure/assert';
import nil from '../common-pure/nil';
import DeviceStorage from '../elo-extension-app/deviceStorage/DeviceStorage';
import config from './config';
import makeExtensionApp from './makeExtensionApp';

Browser.runtime.onInstalled.addListener(async () => {
  if (config.featureFlags.authEnabled) {
    const deviceStorage = await DeviceStorage.Create(Browser.storage.local, 'elo');
    const root = await deviceStorage.readRoot();

    if (!root.installTriggered) {
      root.installTriggered = true;
      await deviceStorage.writeRoot(root);
      window.open(Browser.runtime.getURL('elo-page.html'));
    }
  }
});

Browser.browserAction.onClicked.addListener(() => {
  window.open(Browser.runtime.getURL('elo-page.html'));
});

(async () => {
  const extensionApp = await makeExtensionApp();

  Browser.runtime.onMessage.addListener(async (message: unknown) => {
    if (message !== 'zoom-might-start') {
      return;
    }

    const messageStart = Date.now();

    const rpc = await extensionApp.Rpc();

    if (rpc === nil) {
      return;
    }

    let presenceResult = await rpc.zoom.presence({ longPoll: nil });

    if (presenceResult === 'please-retry' || !presenceResult.connected) {
      return;
    }

    if (presenceResult.presence?.value === 'In_Meeting') {
      const timeSinceUpdated = Date.now() - (+presenceResult.presence.lastUpdated);

      if (timeSinceUpdated < 30000) {
        runExternalCapture();
      }

      return;
    }

    let longPoll = { differentFrom: presenceResult.presence?.value };

    while (true) {
      presenceResult = await rpc.zoom.presence({ longPoll });

      if (Date.now() - messageStart > 30000) {
        break;
      }

      if (presenceResult === 'please-retry') {
        continue;
      }

      if (!presenceResult.connected) {
        // TODO: Prompt user about connecting
        break;
      }

      if (presenceResult.presence?.value === 'In_Meeting') {
        runExternalCapture();
        break;
      }

      longPoll = { differentFrom: presenceResult.presence?.value };
    }
  });

  async function runExternalCapture() {
    const rpc = await extensionApp.requireRpc();

    const externalCaptureWindow = window.open(
      Browser.runtime.getURL('/zoom-external-capture.html'),
      undefined,
      [
        'width=450',
        'height=140',
        `left=${screen.availWidth - 550}`,
        'top=100',
      ].join(',')
    );

    assert(externalCaptureWindow !== null);

    try {
      await rpc.zoom.presence({ longPoll: { differentFrom: 'In_Meeting' } });
    } catch (error) {
      console.error(error);
    }

    externalCaptureWindow.close();
  }
})().catch(console.error);
