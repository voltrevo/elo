import * as React from 'react';

import Page from './Page';
import Section from './Section';
import Field from './Field';
import ExtensionAppContext from '../ExtensionAppContext';
import AccountRoot from '../../elo-extension-app/storage/AccountRoot';
import FunctionalBarSelector from './FunctionalBarSelector';

const SettingsPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ExtensionAppContext);

  const [settings, setSettings] = React.useState<AccountRoot['settings']>();

  async function setSettingsFromStorage() {
    setSettings((await appCtx.readAccountRoot()).settings);
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

            const accountRoot = await appCtx.readAccountRoot();
            accountRoot.settings.liveStatsMode = selection;
            await appCtx.writeAccountRoot(accountRoot);

            await setSettingsFromStorage();
          }}
        />
        </Field>
      </>}
    </Section>
  </Page>;
};

export default SettingsPage;
