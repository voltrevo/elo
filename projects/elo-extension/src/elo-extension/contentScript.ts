import Browser from 'webextension-polyfill';
import { protocolThirdPartyKeyMap } from '../elo-extension-app/Protocol';

import PostMessageServer from '../elo-page/helpers/PostMessageServer';
import config from './config';
import handleZoomRedirects from './handleZoomRedirects';
import handleZoomExternalCapture from './handleZoomExternalCapture';
import handleZoomAuth from './handleZoomAuth';
import makeExtensionApp from './makeExtensionApp';

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

(async () => {
  const extensionApp = await makeExtensionApp();
  
  new PostMessageServer(
    'elo',
    ({ method, args }: any) => {
      if (!(method in protocolThirdPartyKeyMap)) {
        throw new Error(`Method not found: ${method}`);
      }
  
      return (extensionApp as any)[method](...args)
    },
  );

  if (config.featureFlags.zoomRedirects) {
    await handleZoomRedirects(extensionApp);
  }

  if (config.featureFlags.zoomExternalCapture) {
    await handleZoomExternalCapture();
  }

  await handleZoomAuth();
})().catch(
  console.error
);
