import * as React from 'react';

import {
  CheckCircle, Circle, CircleNotch, XCircle,
} from 'phosphor-react';
import ExtensionAppContext from '../ExtensionAppContext';
import EloPageContext from '../EloPageContext';
import AsyncButton from './AsyncButton';
import Button from './Button';
import Page from './Page';
import BarSelector from './BarSelector';
import ResendEmailDialog from './ResendEmailDialog';
import switch_ from '../../common-pure/switch_';
import TermsAndConditionsDialog from './TermsAndConditionsDialog';
import delay from '../../common-pure/delay';
import Section from './Section';
import Field from './Field';
import errorHasTag from '../../common-pure/errorHasTag';
import nil from '../../common-pure/nil';
import onEnter from './helpers/onEnter';

const WelcomePage: React.FunctionComponent = () => {
  const pageCtx = React.useContext(EloPageContext);
  const appCtx = React.useContext(ExtensionAppContext);

  const [authMethod, setAuthMethod] = React.useState<'service' | 'password'>();
  const [authChoice, setAuthChoice] = React.useState<'register' | 'login'>('register');
  const [serviceEmail, setServiceEmail] = React.useState<string>();
  const [googleAccessToken, setGoogleAccessToken] = React.useState<string>('');

  return <Page classes={['form-page', 'welcome-page']}>
    <Section>
      <h1>Welcome</h1>
      <div>It looks like you're new here. You'll need an account to get started.</div>
    </Section>
    <Section>
      <div className="button-column">
        <AsyncButton
          primary={false}
          enabled={authMethod !== 'service' || googleAccessToken === ''}
          onClick={async () => {
            setAuthMethod('service');

            if (serviceEmail !== undefined) {
              return;
            }

            const authResult = await appCtx.googleAuth();

            if (!authResult.detail.verified_email) {
              throw new Error('Verified google account but its email address is unverified.');
            }

            setGoogleAccessToken(authResult.token);

            try {
              await appCtx.login({ googleAccessToken: authResult.token });
              const zoomEmail = await appCtx.lookupZoomEmail();
              proceed(pageCtx, zoomEmail);
            } catch (error) {
              if (errorHasTag(error, 'wrong-auth')) {
                throw new Error([
                  `It looks like you (${authResult.detail.email}) already have an account but`,
                  'haven\'t authorized logging in via Google. Maybe try email?',
                ].join(' '));
              }

              setServiceEmail(authResult.detail.email);
            }
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
    </Section>

    {authMethod === 'password' && <>
      <Section>
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
      </Section>

      {authChoice === 'login' ? <LoginForm/> : <RegistrationForm/>}
    </>}

    {
      authMethod === 'service' &&
      serviceEmail !== undefined &&
      <ServiceForm email={serviceEmail} googleAccessToken={googleAccessToken}/>
    }
  </Page>;
};

export default WelcomePage;

function LoginForm() {
  const appCtx = React.useContext(ExtensionAppContext);
  const pageCtx = React.useContext(EloPageContext);

  const [email, setEmail] = React.useState('');
  const [passwd, setPasswd] = React.useState('');

  const loginBtn = React.useRef<HTMLDivElement>();

  return <>
    <Section>
      <Field>
        <div>Email</div>
        <input
          type="text"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => setEmail(evt.target.value)}
          {...onEnter(() => loginBtn.current?.click())}
        />
      </Field>
      <Field>
        <div>Password</div>
        <input
          type="password"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => setPasswd(evt.target.value)}
          {...onEnter(() => loginBtn.current?.click())}
        />
      </Field>
      <div className="button-column">
        <AsyncButton
          ref_={r => loginBtn.current = r}
          once={true}
          enabled={Boolean(email && passwd)}
          onClick={async () => {
            await appCtx.login({
              email,
              password: passwd,
            });

            const zoomEmail = await appCtx.lookupZoomEmail();
            proceed(pageCtx, zoomEmail);
          }}
        >
          Log In
        </AsyncButton>
      </div>
    </Section>
  </>;
}

function RegistrationForm() {
  const pageCtx = React.useContext(EloPageContext);
  const appCtx = React.useContext(ExtensionAppContext);

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

  const sendVerificationEmailBtn = React.useRef<HTMLDivElement>();
  const registerBtn = React.useRef<HTMLDivElement>();

  const validEmailAndPassword = Boolean(email && passwd && passwd === confirmPasswd);
  const validSentEmail = validEmailAndPassword && email === sentEmail;

  return <>
    <Section>
      <Field>
        <div>Email</div>
        <input
          type="text"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => setEmail(evt.target.value)}
          {...onEnter(() => sendVerificationEmailBtn.current?.click())}
        />
      </Field>
      <Field>
        <div>Password</div>
        <input
          type="password"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => setPasswd(evt.target.value)}
          {...onEnter(() => sendVerificationEmailBtn.current?.click())}
        />
      </Field>
      <Field>
        <div>Confirm Password</div>
        <input
          type="password"
          onInput={(evt: React.ChangeEvent<HTMLInputElement>) => setConfirmPasswd(evt.target.value)}
          {...onEnter(() => sendVerificationEmailBtn.current?.click())}
        />
      </Field>
      <div className="button-column">
        <AsyncButton
          ref_={r => { sendVerificationEmailBtn.current = r; }}
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
    </Section>
    {validSentEmail && <Section>
      <Field>
        <div>Verification Code</div>
        <div
          className="field-text-wrapper"
          {...onEnter(() => registerBtn?.current?.click())}
        >
          <input
            type="text"
            onInput={async (evt: React.ChangeEvent<HTMLInputElement>) => {
              const newCode = evt.target.value;
              setVerificationCode(newCode);

              if (newCode.length === 6) {
                const currentEmail = email;
                const currentCode = newCode;
                const correct = (await appCtx.checkVerificationEmail(email, newCode)).verified;

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
      </Field>
    </Section>}
    {validSentEmail && <RegisterSegment
      btnRef={(r) => { registerBtn.current = r; }}
      onClick={async () => {
        await appCtx.register({
          email,
          password: passwd,
          code: verificationCode,
        });
      }}
      enabled={
        verificationCheck?.code === verificationCode &&
        verificationCheck?.correct
      }
    />}
  </>;
}

function ServiceForm({ email, googleAccessToken }: { email: string, googleAccessToken: string }) {
  const appCtx = React.useContext(ExtensionAppContext);

  return <>
    <Section>
      <Field>
        <div>Google Account</div>
        <div>{email}</div>
      </Field>
    </Section>
    <RegisterSegment onClick={async () => {
      await appCtx.register({ googleAccessToken });
    }}/>
  </>;
}

function RegisterSegment({
  onClick,
  enabled = true,
  btnRef,
}: {
  onClick: () => Promise<void>;
  enabled?: boolean;
  btnRef?: (r: HTMLDivElement | nil) => void;
}) {
  const pageCtx = React.useContext(EloPageContext);

  return <Section>
    <div className="tos-notice">
      By clicking <b>Register</b> below, you are agreeing to Elo's&nbsp;
      <a onClick={() => {
        pageCtx.update({ dialog: <TermsAndConditionsDialog/> });
      }}>
        Terms and Conditions
      </a>.
    </div>
    <div className="button-column">
      <AsyncButton
        ref_={btnRef}
        once={true}
        onClick={async () => {
          await onClick();
          proceed(pageCtx, nil);
        }}
        enabled={enabled}
      >
        Register
      </AsyncButton>
    </div>
  </Section>;
}

async function proceed(pageCtx: EloPageContext, zoomEmail: string | nil) {
  pageCtx.update({ needsAuth: false });

  await delay(250);

  let hash = zoomEmail === nil ? 'ConnectZoomPage' : 'OverviewPage';

  if (
    hash === 'ConnectZoomPage' &&
    pageCtx.featureFlags.zoomSpecialActivationRequired
  ) {
    const storageRoot = await pageCtx.deviceStorage.readRoot();

    if (!storageRoot.zoomSpecialActivation) {
      hash = 'OverviewPage';
    }
  }

  pageCtx.update({ hash });
}
