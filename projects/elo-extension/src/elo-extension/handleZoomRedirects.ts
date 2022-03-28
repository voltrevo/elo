import Browser from "webextension-polyfill";
import ExtensionApp from "../elo-extension-app/ExtensionApp";
import documentLoaded from "./documentLoaded";

export default async function handleZoomRedirects(extensionApp: ExtensionApp) {
  const isZoom = location.host === 'zoom.us' || location.host.endsWith('.zoom.us');

  if (!isZoom) {
    return;
  }

  await tryRedirect();
  await redirectMessaging();

  async function tryRedirect() {
    if (!location.pathname.startsWith('/j/')) {
      return;
    }

    const locationUrl = new URL(location.href);

    if (locationUrl.searchParams.get('disableEloRedirect') === 'true') {
      return;
    }
 
    const holdingUrl = new URL(Browser.runtime.getURL('/zoom-holding-page.html'));
    holdingUrl.searchParams.set('inviteUrl', location.href);

    location.href = holdingUrl.href;
  }

  async function redirectMessaging() {
    if (!location.pathname.startsWith('/wc/join/')) {
      return;
    }

    const locationUrl = new URL(location.href);

    if (locationUrl.searchParams.get('isEloRedirect') !== 'true') {
      return;
    }

    const meetingId = location.pathname.replace('/wc/join/', '');

    await documentLoaded;

    const joinFormContainer = document.querySelector('#join-form-container');
    let messagingContainer = joinFormContainer;

    if (messagingContainer === null) {
      const floatingContainer = document.createElement('div');
      document.body.append(floatingContainer);

      floatingContainer.style.position = 'absolute';
      floatingContainer.style.left = '1em';
      floatingContainer.style.top = '80px';
      floatingContainer.style.borderRadius = '5px';
      floatingContainer.style.border = '1px solid black';
      floatingContainer.style.width = '500px';

      messagingContainer = floatingContainer;
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('form-group');

    const desktopUrl = new URL(location.href);
    desktopUrl.pathname = `/j/${meetingId}`;
    desktopUrl.searchParams.set('disableEloRedirect', 'true');

    messageDiv.innerHTML = [
      '<b>Elo</b>: We\'ve redirected you to Zoom\'s web client because we don\'t support the ',
      `<a href="${desktopUrl.href}">desktop client</a>`,
      '. You can change this behavior in ',
      `<a href="${Browser.runtime.getURL('/elo-page.html#settings')}">settings</a>.`,
    ].join('');

    messagingContainer.append(messageDiv);

    if (messagingContainer !== joinFormContainer) {
      const okBtnDiv = document.createElement('div');
      messagingContainer.append(okBtnDiv);
      const okBtn = document.createElement('button');
      okBtn.textContent = 'Ok';
      okBtn.style.width = '100%';
      okBtnDiv.append(okBtn);
      okBtn.onclick = () => messagingContainer?.remove();
    }
  }
}
