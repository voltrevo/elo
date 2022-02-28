import * as ReactDOM from 'react-dom';
import Browser from 'webextension-polyfill';
import EloPage from '../elo-page/components/EloPage';
import { makeLocalContentAppClient } from '../elo-page/ContentAppClient';
import ContentAppContext from '../elo-page/ContentAppContext';
import EloPageContext, { initEloPageContext } from '../elo-page/EloPageContext';
import Storage from '../elo-page/storage/Storage';

import ContentApp from './ContentApp';

import clientConfig from './helpers/clientConfig';

const contentApp = makeLocalContentAppClient(new ContentApp());
(window as any).contentApp = contentApp;

window.addEventListener('load', async () => {
  const pageCtx = initEloPageContext(new Storage(Browser.storage.local, 'elo'), clientConfig.featureFlags);

  const { registrationData } = await pageCtx.storage.readRoot();
  const needsAuth = clientConfig.featureFlags.authEnabled && !registrationData;

  pageCtx.update({
    page: needsAuth ? 'AuthPage' : 'LastSessionPage',
  });

  ReactDOM.render(
    <ContentAppContext.Provider value={contentApp}>
      <EloPageContext.Provider value={pageCtx}>
        <EloPage/>
      </EloPageContext.Provider>
    </ContentAppContext.Provider>,
    document.body,
  );
});
