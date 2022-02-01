import * as React from 'react';
import EloPageContext from '../EloPageContext';

const SignUpPage: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);

  return <>
    <h1>Welcome to Elo!</h1>
    <table>
      <tr>
        <td>Email</td>
        <td>
          <input type="text" />
        </td>
      </tr>
      <tr>
        <td>Password</td>
        <td>
          <input type="password" />
        </td>
      </tr>
      <tr>
        <td>Confirm Password</td>
        <td>
          <input type="password" />
        </td>
      </tr>
    </table>
  </>;
};

export default SignUpPage;
