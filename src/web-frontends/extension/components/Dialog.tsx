import * as React from 'react';

import { Modal } from '@mui/material';
import EloPageContext from '../EloPageContext';

const Dialog: React.FunctionComponent = ({ children }) => {
  const pageCtx = React.useContext(EloPageContext);

  return <Modal
    open={true}
    onClose={() => { pageCtx.update({ dialog: '' }); }}
  >
    <div className="elo-page" style={{
      outline: 0,
      position: 'absolute',
      left: '50%',
      top: '50px',
      transform: 'translate(-50%, 0)',
      maxHeight: 'calc(100vh - 100px)',
      overflowY: 'auto',
    }}>
      {children}
    </div>
  </Modal>;
};

export default Dialog;
