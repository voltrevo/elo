import { boolean } from 'fp-ts';
import * as react from 'react';

type Props = {
  enabled?: boolean;
  onClick?: () => void;
};

const Button: react.FunctionComponent<Props> = (props) => {
  const enabled = props.enabled !== false;

  return <div
    className={`button ${enabled ? '' : 'disabled'}`}
    onClick={() => {
      if (!enabled || props.onClick === undefined) {
        return;
      }

      props.onClick();
    }}
  >
    {props.children}
  </div>
};

export default Button;
