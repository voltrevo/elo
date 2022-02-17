import Browser from 'webextension-polyfill';

import PostMessageServer from './helpers/PostMessageServer';
import ContentApp from './ContentApp';

const eloExtension = document.createElement('div');
eloExtension.id = 'elo-extension';
document.documentElement.appendChild(eloExtension);

const pageScriptTag = document.createElement('script');
pageScriptTag.src = Browser.runtime.getURL('pageContentScript.bundle.js');
eloExtension.appendChild(pageScriptTag);

const pageLinkTag = document.createElement('link');
pageLinkTag.setAttribute('rel', 'stylesheet');
pageLinkTag.rel = 'stylesheet';
pageLinkTag.href = Browser.runtime.getURL('css/extension.css');
eloExtension.appendChild(pageLinkTag);

const iconTag = document.createElement('img');
iconTag.setAttribute('id', 'icon-template');
iconTag.src = Browser.runtime.getURL('assets/icons/icon128.png');
iconTag.style.display = 'none';
eloExtension.appendChild(iconTag);

const contentApp = new ContentApp();

new PostMessageServer(
  'elo',
  ({ method, args }: any) => (contentApp as any)[method](...args),
);
