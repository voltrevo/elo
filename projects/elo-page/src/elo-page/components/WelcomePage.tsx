import * as React from 'react';

import delay from '../../common-pure/delay';
import ContentAppContext from '../ContentAppContext';
import EloPageContext from '../EloPageContext';
import AsyncButton from './AsyncButton';
import Button from './Button';
import Page from './Page';
import BarSelector from './BarSelector';
import ResendEmailDialog from './ResendEmailDialog';
import switch_ from '../../common-pure/switch_';
import { Check, Spinner, X } from 'phosphor-react';
import TermsAndConditionsDialog from './TermsAndConditionsDialog';

const WelcomePage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ContentAppContext);
  const [authMethod, setAuthMethod] = React.useState<'service' | 'password'>('service');
  const [authChoice, setAuthChoice] = React.useState<'register' | 'login'>('register');

  return <Page>
    <h1>Welcome</h1>

    <div className="welcome-container">
      <p>It looks like you're new here. You'll need an account to get started.</p>
      <div className="welcome-form">
        <div className="button-column">
          <AsyncButton
            primary={false}
            onClick={async () => {
              setAuthMethod('service')
              const authResult = await appCtx.googleAuth();

              console.log("Verified as", authResult.email);
            }}
          >
            Continue with Google
          </AsyncButton>
          <Button primary={false} onClick={() => setAuthMethod('password')}>
            Use a Password
          </Button>
        </div>

        {authMethod === 'password' &&  <>
          <BarSelector
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
        </>}
      </div>
    </div>
  </Page>;
};

export default WelcomePage;

function LoginForm() {
  const appCtx = React.useContext(ContentAppContext);

  const [email, setEmail] = React.useState('');
  const [passwd, setPasswd] = React.useState('');

  const [loginErrorMessage, setLoginErrorMessage] = React.useState<string>();

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
    <div className="button-column" style={{ marginTop: '1em' }}>
      <AsyncButton
        enabled={Boolean(email && passwd)}
        onClick={async () => {
          setLoginErrorMessage(undefined);

          try {
            await appCtx.login(email, passwd);
          } catch (error) {
            setLoginErrorMessage((error as Error).message);
            throw error;
          }
        }}
      >
        Log In
      </AsyncButton>
    </div>
    {loginErrorMessage !== undefined && <div className="welcome-error">
      {loginErrorMessage}
    </div>}
  </>;
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

  const [registerErrorMessage, setRegisterErrorMessage] = React.useState<string>();

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
    <div className="button-column" style={{ marginTop: '1em' }}>
      <AsyncButton
        key={validEmailAndPassword && email || ''}
        enabled={validEmailAndPassword}
        defaultResult={email === sentEmail ? 'success' : undefined}
        onClick={async () => {
          if (email !== sentEmail) {
            await appCtx.sendVerificationEmail(email);
            setSentEmail(email);
          } else {
            pageCtx.update({
              dialog: <ResendEmailDialog sentEmail={sentEmail}/>,
            });
          }
        }}
      >
        Send verification email
      </AsyncButton>
    </div>
    {validSentEmail && <div className="field">
      <div>Verification Code</div>
      <div className="field-text-wrapper">
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
        />
        <div className="field-icon">
          <div className="vertical-helper">
            {switch_<React.ReactNode>(
              [
                [verificationCode.length === 6, switch_(
                  [
                    [
                      (
                        verificationCheck?.email !== email ||
                        verificationCheck?.code !== verificationCode
                      ),
                      <div className="spinner">
                        <Spinner size={24}/>
                      </div>,
                    ],
                    [verificationCheck?.correct === true, <Check size={24}/>],
                  ],
                  <X size={24}/>,
                )],
              ],
              <></>,
            )}
          </div>
        </div>
      </div>
    </div>}
    {validSentEmail && <div className="tos-notice">
      By clicking <b>Register</b> below, you are agreeing to Elo's&nbsp;
      <a onClick={() => {
        pageCtx.update({ dialog: <TermsAndConditionsDialog/> })
      }}>
        Terms and Conditions
      </a>.
    </div>}
    {validSentEmail && <div className="button-column" style={{ marginTop: '1em' }}>
      <AsyncButton
        onClick={async () => {
          try {
            await appCtx.register(email, passwd, verificationCode);
          } catch (error) {
            setRegisterErrorMessage((error as Error).message);
            throw error;
          }
        }}
        enabled={
          verificationCheck?.code === verificationCode &&
          verificationCheck?.correct
        }
      >
        Register
      </AsyncButton>
    </div>}
    {registerErrorMessage !== undefined && <div className="welcome-error">
      {registerErrorMessage}
    </div>}
  </>;
}
