import * as React from 'react';
import delay from '../../common-pure/delay';

import ContentAppContext from '../ContentAppContext';
import EloPageContext from '../EloPageContext';
import AsyncButton from './AsyncButton';
import AsyncContent from './AsyncContent';
import Page from './Page';

const AccountPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ContentAppContext);
  const pageCtx = React.useContext(EloPageContext);

  return <Page classes={['form-page']}>
    <h1>Account</h1>

    <div className="field">
      <div>Email</div>
      <div>
        <AsyncContent load={() => appCtx.getEmail()}/>
      </div>
    </div>

    <div className="button-column">
      <AsyncButton
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
  </Page>;
};

export default AccountPage;
