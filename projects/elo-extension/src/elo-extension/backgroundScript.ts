import Browser from 'webextension-polyfill';

import Storage from '../elo-extension-app/storage/Storage';
import config from './config';

Browser.runtime.onInstalled.addListener(async () => {
  if (config.featureFlags.authEnabled) {
    const storage = new Storage(Browser.storage.local, 'elo');
    const root = await storage.readRoot();

    if (!root.installTriggered) {
      root.installTriggered = true;
      await storage.writeRoot(root);
      window.open(Browser.runtime.getURL('elo-page.html'));
    }
  }
});

Browser.browserAction.onClicked.addListener(() => {
  window.open(Browser.runtime.getURL('elo-page.html'));
});
