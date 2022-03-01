import { boolean } from 'fp-ts';
import * as react from 'react';

type Props = {
  enabled?: boolean;
  primary?: boolean;
  onClick?: () => void;
};

const Button: react.FunctionComponent<Props> = (props) => {
  const enabled = props.enabled !== false;
  const primary = props.primary !== false;

  return <div
    className={`button ${primary && 'primary'} ${enabled ? '' : 'disabled'}`}
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
