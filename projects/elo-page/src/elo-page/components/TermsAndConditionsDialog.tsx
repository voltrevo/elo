import * as React from 'react';

import EloPageContext from '../EloPageContext';
import Button from './Button';

const TermsAndConditionsDialog: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);

  return <div className="terms-and-conditions-dialog">
    <h1>Terms and Conditions</h1>

    <p>
      TBD.
    </p>

    <div className="button-row">
      <Button
        primary={false}
        onClick={() => pageCtx.update({ dialog: undefined })}
      >
        Close
      </Button>
    </div>
  </div>
}

export default TermsAndConditionsDialog;
