import * as React from 'react';

import { Modal } from '@mui/material';
import EloPageContext from '../EloPageContext';

const Dialog: React.FunctionComponent = ({ children }) => {
  const pageCtx = React.useContext(EloPageContext);

  return <Modal
    open={true}
    onClose={() => { pageCtx.update({ dialog: '' }); }}
  >
    <div style={{
      outline: 0,
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      {children}
    </div>
  </Modal>;
};

export default Dialog;
