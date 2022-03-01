import * as React from 'react';

import ContentAppContext from '../ContentAppContext';
import EloPageContext from '../EloPageContext';
import AsyncButton from './AsyncButton';
import Button from './Button';

export type ResendEmailProps = {
  sentEmail: string;
};

const ResendEmailDialog: React.FunctionComponent<ResendEmailProps> = (props) => {
  const appCtx = React.useContext(ContentAppContext);
  const pageCtx = React.useContext(EloPageContext);

  return <div className="resend-email-dialog">
    <h1>Email Verification</h1>

    <p>
      Emails usually arrive very fast. However, depending on your email
      provider and software, it may take some time.
    </p>

    <p>
      Make sure you check your spam folder if you have one.
    </p>

    <div className="button-row">
      <Button
        onClick={() => {
          pageCtx.update({ dialog: undefined });
        }}
        primary={false}
      >
        Close
      </Button>
      <AsyncButton
        onClick={async () => {
          await appCtx.sendVerificationEmail(props.sentEmail);
        }}
      >
        Resend verification email
      </AsyncButton>
    </div>
  </div>
}

export default ResendEmailDialog;
