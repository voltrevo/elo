import * as React from 'react';
import { Pencil } from 'phosphor-react';

import Page from './Page';
import Section from './Section';
import Field from './Field';
import ExtensionAppContext from '../ExtensionAppContext';
import FunctionalBarSelector from './FunctionalBarSelector';
import nil from '../../common-pure/nil';
import Settings, { defaultSettings } from '../../elo-extension-app/sharedStorageTypes/Settings';
import ConnectZoomButton from './ConnectZoomButton';
import LoadingSpinner from './LoadingSpinner';

const SettingsPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ExtensionAppContext);

  const [settings, setSettings] = React.useState<Settings>();

  const [
    zoomConnection,
    setZoomConnection,
  ] = React.useState<{ zoomEmail: string | nil }>();

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
    })();
  }, []);

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
        <Field>
          <div>
            Zoom Connection
          </div>
          <div>
            {zoomConnection === nil && <>
              <LoadingSpinner/>
            </>}
            {zoomConnection && zoomConnection.zoomEmail === nil && <>
              <ConnectZoomButton primary={false}/>
            </>}
            {zoomConnection && zoomConnection.zoomEmail !== nil && <>
              <div style={{
                fontSize: '1.5em',
                lineHeight: '1.5em',
                display: 'flex',
                flexDirection: 'row',
                gap: '0.5em',
                justifyContent: 'end',
              }}>
                <div>{zoomConnection.zoomEmail}</div>
                <div><Pencil size={24}/></div>
              </div>
            </>}
          </div>
        </Field>
      </>}
    </Section>
  </Page>;
};

export default SettingsPage;
