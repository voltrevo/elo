import * as React from 'react';

import EloPageContext from '../EloPageContext';
import Button from './Button';
import TermsAndConditions from './TermsAndConditions';

const TermsAndConditionsDialog: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);

  return <div className="terms-and-conditions-dialog">
    <TermsAndConditions/>

    <div className="button-row">
      <Button
        onClick={() => pageCtx.update({ dialog: undefined })}
      >
        Close
      </Button>
    </div>
  </div>
}

export default TermsAndConditionsDialog;
