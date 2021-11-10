import * as preact from 'preact';

import ReportPrototype from './components/ReportPrototype';

window.addEventListener('load', () => {
  preact.render(<ReportPrototype/>, document.body);
});
