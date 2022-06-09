import { Info } from 'phosphor-react';
import * as React from 'react';

type Props = {
  onAction: () => void;
};

const WidgetNotification: React.FunctionComponent<Props> = (props) => {
  return <div className="widget-notification" onClick={props.onAction}>
    <div>
      <div>
        <div style={{ fontSize: '1px' }}><Info size={22}/></div>
        <div>{props.children}</div>
      </div>
    </div>
  </div>;
};

export default WidgetNotification;
