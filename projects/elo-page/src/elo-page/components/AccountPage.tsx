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
          return <>
            <Field>
              <div>Email</div>
              <div>{email}</div>
            </Field>
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
          </>
        }

        return <>
          <div>
            <p>
              Hey, you've got an anonymous account! If you wish, you can stay
              anonymous for now, but we encourage you to sign up for a real
              account.
            </p>

            <p>
              Your anonymous account data will be migrated to the next account
              you register or log in to.
            </p>
          </div>
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
                Create an Account
              </AsyncButton>
            </div>
        </>
      }}/>
    </Section>
  </Page>;
};

export default AccountPage;
