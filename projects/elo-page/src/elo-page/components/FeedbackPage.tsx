import * as React from 'react';

import delay from '../../common-pure/delay';
import ExtensionAppContext from '../ExtensionAppContext';
import EloPageContext, { useEloPageContext } from '../EloPageContext';
import AsyncButton from './AsyncButton';
import BarSelector from './BarSelector';
import Button from './Button';
import Page from './Page';
import Section from './Section';

const FeedbackPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ExtensionAppContext);
  const pageCtx = React.useContext(EloPageContext);

  const [sentiment, setSentiment] = React.useState<string>();
  const [message, setMessage] = React.useState('');
  const [anonymous, setAnonymous] = React.useState(false);
  const [emailInterest, setEmailInterest] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [autoReply, setAutoReply] = React.useState<string>();

  const needsAuth = useEloPageContext(s => s.needsAuth);

  const emojis = ['😡', '🙁', '🤷', '🙂', '😀'];
  const positiveEmojis = ['🙂', '😀'];
  const negativeEmojis = ['😡', '🙁'];

  if (autoReply !== undefined) {
    return <Page classes={['form-page']}>
      <Section>
        <h1>Feedback Submitted</h1>
        <div>
          {autoReply}
        </div>
        <div className="button-column">
          <Button
            onClick={() => {
              pageCtx.update({
                hash: needsAuth
                  ? 'WelcomePage'
                  : 'OverviewPage'
              });
            }}
          >
            Close
          </Button>
        </div>
      </Section>
    </Page>;
  }

  return <Page classes={['form-page', 'feedback-page']}>
    <Section>
      <h1>Feedback</h1>
      Thanks for taking a moment to do this. It means a lot to us.
    </Section>

    <Section>
      <div>
        <div className="question">
          How do you feel about Elo in this moment?
        </div>
        <BarSelector
          classes={['emojis']}
          options={emojis}
          onSelect={emoji => setSentiment(emoji)}
        />
      </div>
      <div>
        <div className="question">
          Is there anything specific you'd like to say?
        </div>
        <div>
          <textarea onInput={(evt: React.ChangeEvent<HTMLTextAreaElement>) => {
            setMessage(evt.target.value);
          }}></textarea>
        </div>
      </div>
      <div>
        <div className="question">
          Would you like to be anonymous?
        </div>
        <BarSelector
          options={['No', 'Yes']}
          default_={{
            value: 'No',
            allowNoSelection: false,
          }}
          onSelect={selection => setAnonymous(selection !== 'No')}
        />
      </div>

      {anonymous && <div>
        Ok, we won't link this feedback with your account.
      </div>}

      {!anonymous && <div>
        <div className="question">
          Are you interested in an email reply?
        </div>
        <BarSelector
          options={['No', 'Yes']}
          default_={{
            value: 'No',
            allowNoSelection: false,
          }}
          onSelect={selection => setEmailInterest(selection === 'Yes')}
        />
      </div>}

      {!anonymous && emailInterest && <div>
        <div className="question">
          We can't guarantee this, but we'll try. What's your email?
        </div>
        <input type="text" onInput={(evt: React.ChangeEvent<HTMLInputElement>) => {
          setEmail(evt.target.value);
        }} />
      </div>}
    </Section>

    <Section>
      <div className="button-column">
        <AsyncButton once={true} onClick={async () => {
          const sendFeedbackResult = await appCtx.sendFeedback({
            sentiment,
            positive: positiveEmojis.includes(sentiment ?? ''),
            negative: negativeEmojis.includes(sentiment ?? ''),
            message: message || undefined,
            anonymous,
            emailInterest: !anonymous && emailInterest,
            email: anonymous ? undefined : email,
          });

          delay(500).then(() => {
            setAutoReply(sendFeedbackResult);
          });
        }}>
          Submit
        </AsyncButton>
      </div>
    </Section>
  </Page>;
};

export default FeedbackPage;
