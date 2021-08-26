const pageScriptTag = document.createElement('script');
pageScriptTag.src = chrome.runtime.getURL('pageContentScript.bundle.js');

document.documentElement.appendChild(pageScriptTag);
