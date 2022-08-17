import * as react from 'react';

type Props = {
  classes?: string[];
  onKeyDown?: (evt: react.KeyboardEvent<HTMLDivElement>) => void;
};

const Page: react.FunctionComponent<Props> = ({
  classes = [],
  children,
  onKeyDown,
}) => {
  return <div
    className={['elo-page-container', ...classes].join(' ')}
    tabIndex={0}
    style={{ outline: 'none' }}
    onKeyDown={(evt) => {
      onKeyDown?.(evt);
    }}
  >
    {children}
  </div>
};

export default Page;
