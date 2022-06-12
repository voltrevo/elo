import * as React from 'react';

import config from '../../elo-extension/config';
import ExtensionAppContext from '../ExtensionAppContext';
import AsyncButton from './AsyncButton';

const ConnectZoomButton: React.FunctionComponent<{
  primary: boolean,
  onSuccess: (zoomEmail: string) => void,
}> = ({ primary, onSuccess }) => {
  const appCtx = React.useContext(ExtensionAppContext);

  return (
    <AsyncButton
      primary={primary}
      onClick={async () => {
        const margin = 0.04 * window.innerWidth;

        const zoomAuthCode = await new Promise<string>((resolve, reject) => {
          let closePollingId: number | undefined = undefined;

          function messageHandler(evt: MessageEvent) {
            const code = evt.data?.zoomAuthCode;

            if (typeof code === 'string') {
              cleanup();

              try {
                (evt.source as Window).close();
                resolve(code);
              } catch (error) {
                reject(error);
              }
            }
          }

          function cleanup() {
            window.removeEventListener('message', messageHandler);
            window.clearInterval(closePollingId);
          }

          window.addEventListener('message', messageHandler);

          const zoomAuthPopup = window.open(
            config.zoomConnectionUrl,
            undefined,
            [
              `width=${window.innerWidth - 2 * margin}`,
              `height=${window.innerHeight - 2 * margin}`,
              `left=${window.screenLeft + margin}`,
              `top=${window.screenTop + margin}`,
            ].join(',')
          );

          if (zoomAuthPopup) {
            closePollingId = setInterval(() => {
              if (zoomAuthPopup.closed) {
                cleanup();
                reject(new Error('Connection window closed'));
              }
            }, 200) as unknown as number;
          }
        });

        const zoomEmail = await appCtx.connectZoom(zoomAuthCode);
        onSuccess(zoomEmail);
      }}
    >
      Connect
    </AsyncButton>
  );
};

export default ConnectZoomButton;
