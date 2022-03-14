import Browser from 'webextension-polyfill';
import ExtensionApp from '../elo-extension-app/ExtensionApp';
import { protocolThirdPartyKeyMap } from '../elo-extension-app/Protocol';

import PostMessageServer from '../elo-page/helpers/PostMessageServer';
import BackendApi from './BackendApi';
import GoogleAuthApi from './GoogleAuthApi';
import config from './config';

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

const extensionApp = new ExtensionApp(
  new BackendApi(`${config.tls ? 'https:' : 'http:'}//${config.hostAndPort}`),
  new GoogleAuthApi(config.googleOauthClientId),
  Browser.runtime.getURL('elo-page.html'),
  Browser.storage.local,
);

new PostMessageServer(
  'elo',
  ({ method, args }: any) => {
    if (!(method in protocolThirdPartyKeyMap)) {
      throw new Error(`Method not found: ${method}`);
    }

    (extensionApp as any)[method](...args)
  },
);
