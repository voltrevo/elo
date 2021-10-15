import * as preact from 'preact';

import Page from './page/Page';

window.addEventListener('load', () => {
  preact.render(<Page/>, document.body);
});
