import * as ReactDOM from 'react-dom';

import LabellingTool from './components/LabellingTool';

import PageContext, { initPageContext } from './PageContext';

window.addEventListener('load', async () => {
  const pageCtx = initPageContext();

  const appDiv = document.createElement('div');
  document.body.appendChild(appDiv);

  ReactDOM.render(
    <PageContext.Provider value={pageCtx}>
      <LabellingTool/>
    </PageContext.Provider>,
    appDiv,
  );
});
