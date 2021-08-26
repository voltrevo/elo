import * as preact from 'preact';
import Callbacks from './Callbacks';

import App from './components/App';

const languageConfidenceExtension = document.querySelector('#language-confidence-extension')!;

const container = document.createElement('div');
container.style.display = 'none';
languageConfidenceExtension.appendChild(container);

const callbacks: Callbacks = {
  onMessage: () => {},
};

preact.render(<App callbacks={callbacks}/>, container);

// new
(() => {
  const originalGum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

  navigator.mediaDevices.getUserMedia = (...args) => {
    console.log('getUserMedia detected', args);
    container.style.display = '';
    callbacks.onMessage({ type: 'getUserMedia-called', value: null });
    return originalGum(...args);
  };
})();

// old
(() => {
  const originalGum = navigator.getUserMedia.bind(navigator);

  navigator.getUserMedia = (...args) => {
    console.log('old getUserMedia detected', args);
    container.style.display = '';
    callbacks.onMessage({ type: 'getUserMedia-called', value: null });
    return originalGum(...args);
  };
})();
