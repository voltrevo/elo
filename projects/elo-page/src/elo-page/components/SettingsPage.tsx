import * as React from 'react';

import Page from './Page';
import Section from './Section';
import Field from './Field';
import ExtensionAppContext from '../ExtensionAppContext';
import AccountRoot from '../../elo-extension-app/deviceStorage/AccountRoot';
import FunctionalBarSelector from './FunctionalBarSelector';
import nil from '../../common-pure/nil';
import { defaultSettings } from '../../elo-extension-app/sharedStorageTypes/Settings';

const SettingsPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ExtensionAppContext);

  const [settings, setSettings] = React.useState<AccountRoot['settings']>();

  async function setSettingsFromStorage() {
    const settingsRead = (await appCtx.readSettings()) ?? defaultSettings;

    if (settingsRead === nil) {
      return;
    }

    setSettings(settingsRead);
  }

  React.useEffect(() => {
    setSettingsFromStorage();
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
            Experimental Zoom Support
          </div>
          <FunctionalBarSelector
            options={['off', 'on']}
            displayMap={{
              off: 'Off',
              on: 'On',
            }}
            selection={settings.experimentalZoomSupport ? 'on' : 'off'}
            onSelect={async (selection) => {
              if (selection === undefined) {
                return;
              }

              await appCtx.writeSettings({
                ...settings,
                experimentalZoomSupport: (selection === 'on'
                  ? true
                  : undefined
                ),
              });

              await setSettingsFromStorage();
            }}
          />
        </Field>
      </>}
    </Section>
  </Page>;
};

export default SettingsPage;
