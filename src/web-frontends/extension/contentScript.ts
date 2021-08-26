const languageConfidenceExtension = document.createElement('div');
languageConfidenceExtension.id = 'language-confidence-extension';
document.documentElement.appendChild(languageConfidenceExtension);

const pageScriptTag = document.createElement('script');
pageScriptTag.src = chrome.runtime.getURL('pageContentScript.bundle.js');
languageConfidenceExtension.appendChild(pageScriptTag);

const pageLinkTag = document.createElement('link');
pageLinkTag.setAttribute('rel', 'stylesheet');
pageLinkTag.rel = 'stylesheet';
pageLinkTag.href = chrome.runtime.getURL('css/extension.css');
languageConfidenceExtension.appendChild(pageLinkTag);
