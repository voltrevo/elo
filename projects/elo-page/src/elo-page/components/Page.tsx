import * as react from 'react';

type Props = {
  classes?: string[];
};

const Page: react.FunctionComponent<Props> = ({ classes = [], children }) => {
  return <div className={['elo-page-container', ...classes].join(' ')}>{children}</div>
};

export default Page;
