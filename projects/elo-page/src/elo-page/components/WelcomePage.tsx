import * as React from 'react';

import ContentAppContext from '../ContentAppContext';
import EloPageContext from '../EloPageContext';
import AsyncButton from './AsyncButton';
import Button from './Button';
import Page from './Page';
import BarSelector from './BarSelector';
import ResendEmailDialog from './ResendEmailDialog';
import switch_ from '../../common-pure/switch_';
import { CheckCircle, Circle, CircleNotch, XCircle } from 'phosphor-react';
import TermsAndConditionsDialog from './TermsAndConditionsDialog';

const WelcomePage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ContentAppContext);
  const [authMethod, setAuthMethod] = React.useState<'service' | 'password'>();
  const [authChoice, setAuthChoice] = React.useState<'register' | 'login'>('register');
  const [serviceEmail, setServiceEmail] = React.useState<string>();
  const [googleAccessToken, setGoogleAccessToken] = React.useState<string>('');

  return <Page>
    <h1>Welcome</h1>

    <div className="welcome-container">
      <p>It looks like you're new here. You'll need an account to get started.</p>
      <div className="welcome-form">
        <div className="button-column">
          <AsyncButton
            primary={false}
            enabled={authMethod !== 'service' || serviceEmail === undefined}
            onClick={async () => {
              setAuthMethod('service');

              if (serviceEmail !== undefined) {
                return;
              }

              const authResult = await appCtx.googleAuth();

              if (!authResult.detail.verified_email) {
                throw new Error(`Verified google account but its email address is unverified.`);
              }

              setServiceEmail(authResult.detail.email);
              setGoogleAccessToken(authResult.token);
            }}
          >
            Continue with Google
          </AsyncButton>
          <Button
            primary={false}
            enabled={authMethod !== 'password'}
            onClick={() => {
              setAuthMethod('password');
            }}
          >
            Use Email
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

        {
          authMethod === 'service' &&
          serviceEmail !== undefined &&
          <ServiceForm email={serviceEmail} googleAccessToken={googleAccessToken}/>
        }
      </div>
    </div>
  </Page>;
};

export default WelcomePage;

function LoginForm() {
  const appCtx = React.useContext(ContentAppContext);

  const [email, setEmail] = React.useState('');
  const [passwd, setPasswd] = React.useState('');

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
          await appCtx.login({ email, password: passwd });
        }}
      >
        Log In
      </AsyncButton>
    </div>
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
        primary={email !== sentEmail}
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
        Send Verification Email
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
                        <CircleNotch size={24}/>
                      </div>,
                    ],
                    [verificationCheck?.correct === true, <CheckCircle size={24}/>],
                  ],
                  <XCircle size={24}/>,
                )],
              ],
              <div style={{ fontSize: '1px', opacity: '0.3' }}>
                <Circle size={24} />
              </div>,
            )}
          </div>
        </div>
      </div>
    </div>}
    {validSentEmail && <RegisterSegment
      onClick={async () => {
        await appCtx.register({ email, password: passwd, code: verificationCode });
      }}
      enabled={
        verificationCheck?.code === verificationCode &&
        verificationCheck?.correct
      }
    />}
  </>;
}

function ServiceForm({ email, googleAccessToken }: { email: string, googleAccessToken: string }) {
  const appCtx = React.useContext(ContentAppContext);

  return <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={{ marginTop: '2em' }}>
      Hi {email}. We don't have an account for you yet. Would you like to
      register one?
    </div>
    <RegisterSegment onClick={async () => {
      await appCtx.register({ googleAccessToken });
    }}/>
  </div>;
}

function RegisterSegment({
  onClick,
  enabled = true,
}: {
  onClick: () => Promise<void>;
  enabled?: boolean;
}) {
  const pageCtx = React.useContext(EloPageContext);
  const [done, setDone] = React.useState(false);

  return <>
    <div className="tos-notice">
      By clicking <b>Register</b> below, you are agreeing to Elo's&nbsp;
      <a onClick={() => {
        pageCtx.update({ dialog: <TermsAndConditionsDialog/> })
      }}>
        Terms and Conditions
      </a>.
    </div>
    <div className="button-column" style={{ marginTop: '1em' }}>
      <AsyncButton
        onClick={async () => {
          await onClick();
          setDone(true);
        }}
        enabled={enabled && !done}
      >
        Register
      </AsyncButton>
    </div>
  </>;
}
