import * as React from 'react';

import switch_ from '../../../helpers/switch_';
import ContentAppContext from '../ContentAppContext';

const SignUpPage: React.FunctionComponent = () => {
  const [authChoice, setAuthChoice] = React.useState<'signup' | 'login'>('signup');

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

function loginForm() {
  const [email, setEmail] = React.useState('');
  const [passwd, setPasswd] = React.useState('');

  return <table>
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
}

function signupForm() {
  const appCtx = React.useContext(ContentAppContext);

  const [email, setEmail] = React.useState('');
  const [passwd, setPasswd] = React.useState('');
  const [confirmPasswd, setConfirmPasswd] = React.useState('');
  const [sentEmail, setSentEmail] = React.useState<string>();
  const [verificationCode, setVerificationCode] = React.useState<string>('');

  const [verificationCheck, setVerificationCheck] = React.useState<{
    email: string,
    code: string,
    correct: boolean,
  }>();

  return <table>
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
          onInput={async (evt: React.ChangeEvent<HTMLInputElement>) => {
            const newCode = evt.target.value;
            setVerificationCode(newCode);

            if (newCode.length === 6) {
              const currentEmail = email;
              const currentCode = newCode;
              const correct = await appCtx.checkVerificationEmail(email, newCode);

              setVerificationCheck({
                email: currentEmail,
                code: currentCode,
                correct,
              });
            }
          }}
          style={{
            backgroundColor: switch_(
              [
                [verificationCode.length === 0, ''],
                [verificationCode.length < 6, 'lightyellow'],
                [verificationCode.length === 6, switch_(
                  [
                    [
                      (
                        verificationCheck?.email !== email ||
                        verificationCheck?.code !== verificationCode
                      ),
                      'lightblue',
                    ],
                    [verificationCheck?.correct === true, 'lightgreen'],
                  ],
                  'pink',
                )],
              ],
              'pink',
            ),
          }}
        />
      </td>
    </tr>}
  </table>;
}
