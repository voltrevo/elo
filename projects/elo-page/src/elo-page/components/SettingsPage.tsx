import * as React from 'react';

import BarSelector from './BarSelector';
import Page from './Page';
import Section from './Section';
import Field from './Field';

const SettingsPage: React.FunctionComponent = () => {
  // const appCtx = React.useContext(ExtensionAppContext);
  // const pageCtx = React.useContext(EloPageContext);

  return <Page classes={['form-page', 'settings-page']}>
    <Section>
      <h1>Settings</h1>
      
      <Field>
        <div>
          Live Stats Mode
        </div>
        <BarSelector
          options={['Count', 'Recent Average']}
        />
      </Field>
      <Field>
        <div>
          Live Stats Mode
        </div>
        <BarSelector
          options={['Count', 'Recent Average']}
        />
      </Field>
    </Section>
  </Page>;
};

export default SettingsPage;
