import * as preact from 'preact';
import Callbacks from './Callbacks';

import App from './components/App';
import interceptGetUserMedia from './interceptGetUserMedia';

const languageConfidenceExtension = document.querySelector('#language-confidence-extension')!;

const container = document.createElement('div');
container.style.display = 'none';
languageConfidenceExtension.appendChild(container);

const callbacks: Callbacks = {
  onMessage: () => {},
};

preact.render(<App callbacks={callbacks}/>, container);

interceptGetUserMedia(({ constraints, streamPromise }) => {
  container.style.display = '';
  callbacks.onMessage({ type: 'getUserMedia-called', value: null });
});
