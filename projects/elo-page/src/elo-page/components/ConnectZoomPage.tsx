import * as React from 'react';

import ExtensionAppContext from '../ExtensionAppContext';
import EloPageContext from '../EloPageContext';
import AsyncButton from './AsyncButton';
import Button from './Button';
import Page from './Page';
import Section from './Section';
import config from '../../elo-extension/config';

const ConnectZoomPage: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);
  const appCtx = React.useContext(ExtensionAppContext);

  return <Page classes={['form-page', 'welcome-page']}>
    <Section>
      <h1>Connect with Zoom?</h1>
      <div>
        In order to use Elo in Zoom meetings, we need to connect to your Zoom
        account.
      </div>
      <div>
        This step is optional. Elo is already enabled for a variety of other
        meeting platforms including Google Meet and web-based Zoom.
      </div>
      <div>
        If you change your mind later, you can update this in Settings.
      </div>
    </Section>
    <Section>
      <div className="button-column">
        <AsyncButton
          primary={true}
          onClick={async () => {
            const margin = 0.04 * window.innerWidth;

            const zoomAuthCode = await new Promise((resolve, reject) => {
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

            console.log({ zoomAuthCode });
          }}
        >
          Connect
        </AsyncButton>
        <Button
          primary={false}
          onClick={() => {
            pageCtx.update({ hash: 'OverviewPage' });
          }}
        >
          Maybe Later
        </Button>
      </div>
    </Section>
  </Page>;
};

export default ConnectZoomPage;
