import * as ReactDOM from 'react-dom';
import Browser from 'webextension-polyfill';

import { makeLocalExtensionAppClient } from '../elo-page/ExtensionAppClient';
import ExtensionAppContext, { ThirdPartyExtensionAppContext } from '../elo-page/ExtensionAppContext';
import EloPageContext, { initEloPageContext } from '../elo-page/EloPageContext';
import config from './config';
import ExtensionApp from '../elo-extension-app/ExtensionApp';
import DeviceStorage from '../elo-extension-app/deviceStorage/DeviceStorage';
import BackendApi from './BackendApi';
import GoogleAuthApi from './GoogleAuthApi';
import ZoomExternalCapture from './components/ZoomExternalCapture';
import connectGetUserMedia from './connectGetUserMedia';
import makeStorageClient from './makeStorageClient';

window.addEventListener('load', async () => {
  const deviceStorage = await DeviceStorage.Create(Browser.storage.local, 'elo');

  const apiBase = `${config.tls ? 'https:' : 'http:'}//${config.hostAndPort}`;

  const eloExtensionApp = makeLocalExtensionAppClient(new ExtensionApp(
    new BackendApi(`${config.tls ? 'https:' : 'http:'}//${config.hostAndPort}`),
    new GoogleAuthApi(config.googleOauthClientId),
    Browser.runtime.getURL('elo-page.html'),
    deviceStorage,
    (eloLoginToken) => makeStorageClient(apiBase, eloLoginToken),
  ));

  (window as any).eloExtensionApp = eloExtensionApp;

  const pageCtx = initEloPageContext(deviceStorage, config.featureFlags, '');
  const container = document.querySelector('#zoom-external-capture-container') as HTMLDivElement;

  ReactDOM.render(
    <ThirdPartyExtensionAppContext.Provider value={eloExtensionApp}>
      <ExtensionAppContext.Provider value={eloExtensionApp}>
        <EloPageContext.Provider value={pageCtx}>
          <ZoomExternalCapture/>
        </EloPageContext.Provider>
      </ExtensionAppContext.Provider>
    </ThirdPartyExtensionAppContext.Provider>,
    container,
  );

  connectGetUserMedia(container, eloExtensionApp);
});
