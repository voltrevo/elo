import * as preact from 'preact';

import Dashboard from './components/Dashboard';

window.addEventListener('load', () => {
  preact.render(<Dashboard/>, document.body);
});
