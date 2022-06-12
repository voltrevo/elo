import * as React from 'react';

import ExtensionAppContext from '../ExtensionAppContext';
import EloPageContext from '../EloPageContext';
import Button from './Button';
import Page from './Page';
import Section from './Section';
import ConnectZoomButton from './ConnectZoomButton';
import delay from '../../common-pure/delay';

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
        <ConnectZoomButton primary={true} onSuccess={async () => {
          await delay(250);
          pageCtx.update({ hash: 'OverviewPage' });
        }}/>
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
