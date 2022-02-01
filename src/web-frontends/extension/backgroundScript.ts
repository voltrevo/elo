import Browser from 'webextension-polyfill';

import Storage from './storage/Storage';

Browser.runtime.onInstalled.addListener(async () => {
  const storage = new Storage('elo');
  const root = await storage.readRoot();

  if (!root.installTriggered) {
    root.installTriggered = true;
    await storage.writeRoot(root);
    window.open(Browser.runtime.getURL('elo-page.html'));
  }
});

Browser.browserAction.onClicked.addListener(() => {
  window.open(Browser.runtime.getURL('elo-page.html'));
});
