const eloExtension = document.createElement('div');
eloExtension.id = 'elo-extension';
document.documentElement.appendChild(eloExtension);

const pageScriptTag = document.createElement('script');
pageScriptTag.src = chrome.runtime.getURL('pageContentScript.bundle.js');
eloExtension.appendChild(pageScriptTag);

const pageLinkTag = document.createElement('link');
pageLinkTag.setAttribute('rel', 'stylesheet');
pageLinkTag.rel = 'stylesheet';
pageLinkTag.href = chrome.runtime.getURL('css/extension.css');
eloExtension.appendChild(pageLinkTag);
