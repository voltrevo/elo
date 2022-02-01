import * as React from 'react';
import EloPageContext from '../EloPageContext';

const SignUpPage: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);

  return <>
    Sign up page<br/>
    <a onClick={() => pageCtx.update({ page: 'LastSessionPage' })}>Session reports</a>
  </>;
};

export default SignUpPage;
