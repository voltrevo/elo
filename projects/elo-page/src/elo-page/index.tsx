import * as ReactDOM from 'react-dom';

import App from './components/App';

import PageContext, { initPageContext } from './PageContext';

window.addEventListener('load', async () => {
  const pageCtx = initPageContext();

  const appDiv = document.createElement('div');
  document.body.appendChild(appDiv);

  ReactDOM.render(
    <PageContext.Provider value={pageCtx}>
      <App/>
    </PageContext.Provider>,
    appDiv,
  );
});
