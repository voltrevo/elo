import * as React from 'react';
import { Trash } from 'phosphor-react';

import Page from './Page';
import Section from './Section';
import Field from './Field';
import ExtensionAppContext from '../ExtensionAppContext';
import FunctionalBarSelector from './FunctionalBarSelector';
import nil from '../../common-pure/nil';
import Settings, { defaultSettings } from '../../elo-extension-app/sharedStorageTypes/Settings';
import ConnectZoomButton from './ConnectZoomButton';
import LoadingSpinner from './LoadingSpinner';
import EloPageContext from '../EloPageContext';

const SettingsPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ExtensionAppContext);
  const pageCtx = React.useContext(EloPageContext);

  const [settings, setSettings] = React.useState<Settings>();

  const [
    zoomConnection,
    setZoomConnection,
  ] = React.useState<{ zoomEmail: string | nil }>();

  const [
    zoomSpecialActivation,
    setZoomSpecialActivation,
  ] = React.useState<true>();

  async function setSettingsFromStorage() {
    const settingsRead = (await appCtx.readSettings()) ?? defaultSettings;

    if (settingsRead === nil) {
      return;
    }

    setSettings(settingsRead);
  }

  React.useEffect(() => {
    (async () => {
      setSettingsFromStorage();

      const zoomEmail = await appCtx.lookupZoomEmail();
      setZoomConnection({ zoomEmail });

      const storageRoot = await pageCtx.deviceStorage.readRoot();
      setZoomSpecialActivation(storageRoot.zoomSpecialActivation);
    })();
  }, []);

  const zoomEnabled = (
    !pageCtx.featureFlags.zoomSpecialActivationRequired ||
    zoomSpecialActivation
  );

  return <Page classes={['form-page', 'settings-page']}>
    <Section>
      <h1>Settings</h1>

      {!settings && <>Loading...</>}

      {settings && <>
        <Field>
          <div>
            Live Stats Mode
          </div>
          <FunctionalBarSelector
            options={['count', 'recentAverage']}
            displayMap={{
              count: 'Count',
              recentAverage: 'Recent Average',
            }}
            selection={settings.liveStatsMode}
            onSelect={async (selection) => {
              if (selection === undefined) {
                return;
              }

              await appCtx.writeSettings({
                ...settings,
                liveStatsMode: selection,
              });

              await setSettingsFromStorage();
            }}
          />
        </Field>
        {zoomEnabled && <Field>
          <div>
            Zoom Connection
          </div>
          <div>
            {zoomConnection === nil && <>
              <LoadingSpinner/>
            </>}
            {zoomConnection && zoomConnection.zoomEmail === nil && <>
              <ConnectZoomButton primary={false} onSuccess={(zoomEmail) => {
                setZoomConnection({ zoomEmail });
              }}/>
            </>}
            {zoomConnection && zoomConnection.zoomEmail !== nil && <>
              <div style={{
                fontSize: '1.5em',
                lineHeight: '1.5em',
                display: 'flex',
                flexDirection: 'row',
                gap: '0.5em',
              }}>
                <div>{zoomConnection.zoomEmail}</div>
                <div
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={async () => {
                    setZoomConnection(nil);
                    await appCtx.disconnectZoom();
                    setZoomConnection({ zoomEmail: nil });
                  }}
                >
                  <Trash size={24}/>
                </div>
              </div>
            </>}
          </div>
        </Field>}
      </>}
    </Section>
  </Page>;
};

export default SettingsPage;
