import Browser from 'webextension-polyfill';

Browser.browserAction.onClicked.addListener(() => {
  window.open(Browser.runtime.getURL('elo-page.html'));
});
