import * as React from 'react';

import EloPageContext from '../EloPageContext';
import Button from './Button';

const ChangeZoomConnectionDialog: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);

  return <div className="change-zoom-connection-dialog">
    <div>
      Hello
    </div>

    <div className="button-row">
      <Button
        onClick={() => pageCtx.update({ dialog: undefined })}
      >
        Close
      </Button>
    </div>
  </div>
}

export default ChangeZoomConnectionDialog;
