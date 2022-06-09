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
        If you change your mind later, you can update this in Settings.
      </div>
    </Section>
    <Section>
      <div className="button-column">
        <AsyncButton
          primary={true}
          onClick={async () => {
            const margin = 0.04 * window.innerWidth;

            window.open(
              config.zoomConnectionUrl,
              undefined,
              [
                `width=${window.innerWidth - 2 * margin}`,
                `height=${window.innerHeight - 2 * margin}`,
                `left=${window.screenLeft + margin}`,
                `top=${window.screenTop + margin}`,
              ].join(',')
            );

            throw new Error('Not implemented');
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
