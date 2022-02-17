import * as ReactDOM from 'react-dom';

import EloPage from './components/EloPage';
import { makeLocalContentAppClient } from './ContentAppClient';
import ContentAppContext from './ContentAppContext';
import EloPageContext, { initEloPageContext } from './EloPageContext';
import IRawStorage from './storage/IRawStorage';
import Storage from './storage/Storage';

window.addEventListener('load', async () => {
  const appDiv = document.createElement('div');
  document.body.appendChild(appDiv);

  const eloClient = makeLocalContentAppClient({} as any);
  const pageCtx = initEloPageContext(new Storage({} as IRawStorage, 'elo'));

  ReactDOM.render(
    <ContentAppContext.Provider value={eloClient}>
      <EloPageContext.Provider value={pageCtx}>
        <EloPage/>
      </EloPageContext.Provider>
    </ContentAppContext.Provider>,
    appDiv,
  );
});
