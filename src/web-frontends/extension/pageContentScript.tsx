import * as preact from 'preact';

import App from './components/App';

const languageConfidenceExtension = document.querySelector('#language-confidence-extension')!;

const container = document.createElement('div');
languageConfidenceExtension.appendChild(container);

preact.render(<App/>, container);

// new
(() => {
  const originalGum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

  navigator.mediaDevices.getUserMedia = (...args) => {
    console.log('getUserMedia detected', args);
    return originalGum(...args);
  };
})();

// old
(() => {
  const originalGum = navigator.getUserMedia.bind(navigator);

  navigator.getUserMedia = (...args) => {
    console.log('old getUserMedia detected', args);
    return originalGum(...args);
  };
})();
