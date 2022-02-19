import * as React from 'react';
import delay from '../../common-pure/delay';

import switch_ from '../../common-pure/switch_';
import ContentAppContext from '../ContentAppContext';
import EloPageContext from '../EloPageContext';
import AsyncButton from './AsyncButton';
import Button from './Button';
import Page from './Page';
import RowSelector from './RowSelector';

const WelcomePage: React.FunctionComponent = () => {
  const [authChoice, setAuthChoice] = React.useState<'register' | 'login'>('register');

  return <Page>
    <h1>Welcome</h1>

    <div className="welcome-container">
      <div className="welcome-form">
        <RowSelector
          options={['register', 'login']}
          displayMap={{
            register: 'Register',
            login: 'Log In',
          }}
          default_={{
            value: 'register',
            allowNoSelection: false,
          }}
          onSelect={(selection) => setAuthChoice(selection as any)}
        />

        {authChoice === 'login' ? <LoginForm/> : <RegistrationForm/>}
      </div>
    </div>
  </Page>;
};

export default WelcomePage;

function LoginForm() {
  const appCtx = React.useContext(ContentAppContext);

  const [email, setEmail] = React.useState('');
  const [passwd, setPasswd] = React.useState('');

  type LoginResult = {
    success: boolean;
    message?: string;
  };

  const [loginState, setLoginState] = React.useState<'loading' | LoginResult>();

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
      <td>
        <button
          disabled={!(email && passwd && loginState !== 'loading' && (!loginState?.success))}
          onClick={async () => {
            setLoginState('loading');

            let success: LoginResult['success'];
            let message: LoginResult['message'];

            try {
              await appCtx.login(email, passwd);
              success = true;
              message = undefined;
            } catch (error) {
              success = false;
              message = (error as Error).message;
            }

            setLoginState({ success, message });
          }}
        >
          Log In
        </button>
      </td>
      <td>
        {(() => {
          if (loginState === undefined) {
            return undefined;
          }

          if (loginState === 'loading') {
            return <>Loading...</>;
          }

          return <>{loginState.success ? '✅' : '❌'}</>;
        })()}
      </td>
    </tr>
    {loginState !== 'loading' && loginState?.message !== undefined && <tr>
      <td colSpan={2}>
        <p style={{ color: loginState?.success ? '' : 'red' }}>
          {loginState.message}
        </p>
      </td>
    </tr>}
  </table>;
}

function RegistrationForm() {
  const pageCtx = React.useContext(EloPageContext);
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

  type RegisterResult = {
    success: boolean;
    message?: string;
  };

  const [registerState, setRegisterState] = React.useState<'loading' | RegisterResult>();

  const validEmailAndPassword = Boolean(email && passwd && passwd === confirmPasswd);
  const validSentEmail = validEmailAndPassword && email === sentEmail;

  return <>
    <div className="field">
      <div>Email</div>
      <div><input
        type="text"
        onInput={(evt: React.ChangeEvent<HTMLInputElement>) => setEmail(evt.target.value)}
      /></div>
    </div>
    <div className="field">
      <div>Password</div>
      <div>
        <input
          type="password"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => setPasswd(evt.target.value)}
        />
      </div>
    </div>
    <div className="field">
      <div>Confirm Password</div>
      <div>
        <input
          type="password"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => setConfirmPasswd(evt.target.value)}
        />
      </div>
    </div>
    <div className="button-row">
      <AsyncButton
        key={validEmailAndPassword && email || ''}
        enabled={validEmailAndPassword && email !== sentEmail}
        defaultResult={email === sentEmail ? 'success' : undefined}
        onClick={async () => {
          // appCtx.sendVerificationEmail(email);
          await delay(500);
          setSentEmail(email);
        }}
      >
        Send verification email
      </AsyncButton>
      {validSentEmail && <Button
        onClick={() => {
          pageCtx.update({ dialog: 'ResendEmailDialog' });
        }}
      >
        Resend?
      </Button>}
    </div>
    {/*
    <tr>
      <td colSpan={2}>
        <button
          disabled={!(validEmailAndPassword && email !== sentEmail)}
          onClick={() => {
            setSentEmail(email);
            appCtx.sendVerificationEmail(email);
          }}
        >
          {email && email === sentEmail ? 'Sent' : 'Send verification email'}
        </button>

        {validSentEmail && <button>Resend</button>}
      </td>
    </tr>
    {validSentEmail && <tr>
      <td>Verification code</td>
      <td>
        <input
          type="text"
          value={verificationCode}
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
    {validSentEmail && <tr>
      <td>
        <button
          disabled={!(
            verificationCheck?.code === verificationCode &&
            verificationCheck?.correct &&
            registerState !== 'loading' &&
            !registerState?.success
          )}
          onClick={async () => {
            setRegisterState('loading');

            let success: RegisterResult['success'];
            let message: RegisterResult['message'];

            try {
              await appCtx.register(email, passwd, verificationCode);
              success = true;
              message = undefined;
            } catch (error) {
              success = false;
              message = (error as Error).message;
            }

            setRegisterState({ success, message });
          }}
        >
          Register
        </button>
      </td>
      <td>
        {(() => {
          if (registerState === undefined) {
            return undefined;
          }

          if (registerState === 'loading') {
            return <>Loading...</>;
          }

          return <>{registerState.success ? '✅' : '❌'}</>;
        })()}
      </td>
    </tr>}
    {registerState !== 'loading' && registerState?.message !== undefined && <tr>
      <td colSpan={2}>
        <p style={{ color: registerState?.success ? '' : 'red' }}>
          {registerState.message}
        </p>
      </td>
    </tr>} */}
  </>;
}
