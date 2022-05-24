import Browser from 'webextension-polyfill';

import DeviceStorage from '../elo-extension-app/deviceStorage/DeviceStorage';
import config from './config';

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
