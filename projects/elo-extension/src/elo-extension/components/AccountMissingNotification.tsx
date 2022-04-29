import { Info } from 'phosphor-react';
import * as React from 'react';

type Props = {
  onAction: () => void;
};

const AccountMissingNotification: React.FunctionComponent<Props> = (props) => {
  return <div className="account-missing-notification" onClick={props.onAction}>
    <div>
      <div>
        <div style={{ fontSize: '1px' }}><Info size={22}/></div>
        <div>Please register or log in</div>
      </div>
    </div>
  </div>;
};

export default AccountMissingNotification;
