import * as ReactDOM from 'react-dom';
import Browser from 'webextension-polyfill';

import { makeLocalExtensionAppClient } from '../elo-page/ExtensionAppClient';
import ExtensionAppContext, { ThirdPartyExtensionAppContext } from '../elo-page/ExtensionAppContext';
import EloPageContext, { initEloPageContext } from '../elo-page/EloPageContext';
import config from './config';
import DeviceStorage from '../elo-extension-app/deviceStorage/DeviceStorage';
import ZoomExternalCapture from './components/ZoomExternalCapture';
import connectGetUserMedia from './connectGetUserMedia';
import makeExtensionApp from './makeExtensionApp';

window.addEventListener('load', async () => {
  const deviceStorage = await DeviceStorage.Create(Browser.storage.local, 'elo');

  const eloExtensionApp = makeLocalExtensionAppClient(
    await makeExtensionApp(),
  );

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
