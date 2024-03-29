import { ThirdPartyExtensionApp } from "../elo-page/ExtensionAppContext";
import analyzeStream from "./analyzeStream";
import interceptGetUserMedia from "./interceptGetUserMedia";

export default function connectGetUserMedia(
  container: HTMLDivElement,
  contentApp: ThirdPartyExtensionApp,
) {
  interceptGetUserMedia(async ({ constraints, streamPromise }) => {
    if (!constraints.audio) {
      return; // Ignore intercepts without audio
    }

    container.style.display = '';
    await contentApp.notifyGetUserMediaCalled();

    const sessionToken = await contentApp.getSessionToken();

    if (sessionToken === undefined) {
      console.warn('Aborting due to missing sessionToken');
      return;
    }

    streamPromise.then(async stream => {
      const audioStream = new MediaStream(stream.getAudioTracks());

      while (true) {
        contentApp.addConnectionEvent('connecting');

        try {
          await analyzeStream(sessionToken, audioStream, contentApp);
        } catch (error) {
          console.error('elo', error);
        }

        const streamAlive = audioStream.getTracks().some(t => t.readyState !== 'ended');

        if (!streamAlive) {
          break;
        }

        console.log('Elo terminated even though the stream is still going. Restarting in 3s.');
        contentApp.addConnectionEvent('reconnecting');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    });
  });
}