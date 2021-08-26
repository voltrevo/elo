function pageScript() {
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
}

const pageScriptTag = document.createElement('script');
pageScriptTag.textContent = `(${pageScript.toString()})();`;

document.documentElement.appendChild(pageScriptTag);
