import * as React from 'react';
import delay from '../../common-pure/delay';

import ExtensionAppContext from '../ExtensionAppContext';
import EloPageContext from '../EloPageContext';
import AsyncButton from './AsyncButton';
import AsyncContent from './AsyncContent';
import Field from './Field';
import Page from './Page';
import Section from './Section';

const AccountPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ExtensionAppContext);
  const pageCtx = React.useContext(EloPageContext);

  return <Page classes={['form-page']}>
    <Section>
      <h1>Account</h1>
      <AsyncContent load={async () => {
        const email = await appCtx.getEmail();

        if (email) {
          return <Field>
            <div>Email</div>
            <div>{email}</div>
          </Field>
        }

        return <div>
          <p>
            Hey, you've got an anonymous account! That means you've been
            with us since our early days. Your support means so much to us.
          </p>

          <p>
            It's safe to log out. We'll just associate your anonymous account
            data with the next account you create or log in to.
          </p>
        </div>
      }}/>
      <div className="button-column">
        <AsyncButton
          once={true}
          onClick={async () => {
            await appCtx.logout();
            pageCtx.update({ needsAuth: true });

            delay(250).then(() => {
              pageCtx.update({ page: 'WelcomePage' });
            });
          }}
        >
          Log Out
        </AsyncButton>
      </div>
    </Section>
  </Page>;
};

export default AccountPage;
