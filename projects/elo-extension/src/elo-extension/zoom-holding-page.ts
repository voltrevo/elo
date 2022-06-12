import nil from "../common-pure/nil";
import makeExtensionApp from "./makeExtensionApp";

(async () => {
  const extensionApp = await makeExtensionApp();

  const settings = await extensionApp.readSettings();

  const parsedLocation = new URL(location.href);
  const inviteUrl = new URL(parsedLocation.searchParams.get('inviteUrl') ?? '');

  if (settings === nil) {
    console.error('Account root missing');
    return;
  }

  if (settings.zoomRedirectToWebClient === false) {
    inviteUrl.searchParams.set('disableEloRedirect', 'true');
    location.href = inviteUrl.href;
    return;
  }

  const meetingId = inviteUrl.pathname.replace('/j/', '');

  const redirectUrl = new URL(inviteUrl.href);
  redirectUrl.pathname = `/wc/join/${meetingId}`;
  redirectUrl.searchParams.set('isEloRedirect', 'true');

  location.href = redirectUrl.toString();
})().catch(console.error);
