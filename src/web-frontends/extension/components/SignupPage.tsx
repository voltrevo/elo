import * as React from 'react';

import switch_ from '../../../helpers/switch_';
import ContentAppContext from '../ContentAppContext';
import EloPageContext from '../EloPageContext';

const SignUpPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ContentAppContext);
  const pageCtx = React.useContext(EloPageContext);

  const [authChoice, setAuthChoice] = React.useState<'signup' | 'login'>('signup');
  const [email, setEmail] = React.useState('');
  const [passwd, setPasswd] = React.useState('');
  const [confirmPasswd, setConfirmPasswd] = React.useState('');
  const [sentEmail, setSentEmail] = React.useState<string>();
  const [verificationCode, setVerificationCode] = React.useState<string>('');

  const loginForm = () => <table>
    <tr>
      <td>Email</td>
      <td>
        <input
          type="text"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => setEmail(evt.target.value)}
        />
      </td>
    </tr>
    <tr>
      <td>Password</td>
      <td>
        <input
          type="password"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => setPasswd(evt.target.value)}
        />
      </td>
    </tr>
  </table>;

  const signupForm = () => <table>
    <tr>
      <td>Email</td>
      <td>
        <input
          type="text"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => setEmail(evt.target.value)}
        />
      </td>
    </tr>
    <tr>
      <td>Password</td>
      <td>
        <input
          type="password"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => setPasswd(evt.target.value)}
        />
      </td>
    </tr>
    <tr>
      <td>Confirm Password</td>
      <td>
        <input
          type="password"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => {
            setConfirmPasswd(evt.target.value);
          }}
        />
      </td>
    </tr>
    <tr>
      <td colSpan={2}>
        <button
          disabled={!(email && email !== sentEmail && passwd && passwd === confirmPasswd)}
          onClick={() => {
            setSentEmail(email);
            appCtx.sendVerificationEmail(email);
          }}
        >
          {email && email === sentEmail ? 'Sent' : 'Send verification email'}
        </button>
      </td>
    </tr>
    {email && email === sentEmail && <tr>
      <td colSpan={2}>
        <button>Resend</button>
      </td>
    </tr>}
    {email && email === sentEmail && <tr>
      <td>Verification code</td>
      <td>
        <input
          type="text"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => {
            setVerificationCode(evt.target.value);
          }}
          style={{
            backgroundColor: switch_(
              [
                [verificationCode.length === 0, ''],
                [verificationCode.length < 6, 'lightyellow'],
                [verificationCode.length === 6, 'lightblue'],
              ],
              'pink',
            ),
          }}
        />
      </td>
    </tr>}
  </table>;

  return <>
    <h1>Welcome to Elo!</h1>

    <div>
      <input type="radio" checked={authChoice === 'signup'} onClick={() => setAuthChoice('signup')} /> Sign Up
    </div>
    <div>
      <input type="radio" checked={authChoice === 'login'} onClick={() => setAuthChoice('login')} /> Log In
    </div>

    {authChoice === 'login' ? loginForm() : signupForm()}
  </>;
};

export default SignUpPage;
