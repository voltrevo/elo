import * as React from 'react';

import { Modal } from '@mui/material';
import EloPageContext from '../EloPageContext';

const Dialog: React.FunctionComponent = ({ children }) => {
  const pageCtx = React.useContext(EloPageContext);

  return <Modal
    open={true}
    onClose={() => { pageCtx.update({ dialog: '' }); }}
  >
    <div className="elo-page dialog">
      {children}
    </div>
  </Modal>;
};

export default Dialog;
