import * as ReactDOM from 'react-dom';
import Browser from 'webextension-polyfill';
import EloPage from '../elo-page/components/EloPage';
import { makeLocalExtensionAppClient } from '../elo-page/ExtensionAppClient';
import ExtensionAppContext from '../elo-page/ExtensionAppContext';
import EloPageContext, { initEloPageContext } from '../elo-page/EloPageContext';
import Storage from '../elo-page/storage/Storage';

import ContentApp from './ContentApp';

import clientConfig from './helpers/clientConfig';

const contentApp = makeLocalExtensionAppClient(new ContentApp());
(window as any).contentApp = contentApp;

window.addEventListener('load', async () => {
  const pageCtx = initEloPageContext(new Storage(Browser.storage.local, 'elo'), clientConfig);

  const { email } = await pageCtx.storage.readRoot();
  const needsAuth = clientConfig.featureFlags.authEnabled && !email;

  pageCtx.update({
    page: needsAuth ? 'WelcomePage' : 'OverviewPage',
  });

  ReactDOM.render(
    <ExtensionAppContext.Provider value={contentApp}>
      <EloPageContext.Provider value={pageCtx}>
        <EloPage/>
      </EloPageContext.Provider>
    </ExtensionAppContext.Provider>,
    document.body,
  );
});
