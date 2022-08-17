import * as react from 'react';
import nil from '../../common-pure/nil';

import classes from './helpers/classes';

type Props = {
  enabled?: boolean;
  primary?: boolean;
  onClick?: () => void;
  className?: string;
  ref_?: (r: HTMLDivElement | nil) => void;
};

const Button: react.FunctionComponent<Props> = (props) => {
  const enabled = props.enabled !== false;
  const primary = props.primary !== false;

  return <div
    ref={r => {
      props.ref_?.(r ?? nil);
      console.log('Ref callback', r);
    }}
    {...classes(
      `button`,
      primary ? 'primary' : '',
      enabled ? '' : 'disabled',
      props.className,
    )}
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
