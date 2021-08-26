function pageScript() {
  console.log('Hello inside page');
  (window as any).foo = 'baz';
}

const pageScriptTag = document.createElement('script');
pageScriptTag.textContent = `(${pageScript.toString()})();`;

document.body.appendChild(pageScriptTag);
