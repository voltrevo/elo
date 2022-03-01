import { Check, Spinner } from 'phosphor-react';
import * as React from 'react';
import delay from '../../common-pure/delay';
import ContentAppContext from '../ContentAppContext';
import EloPageContext from '../EloPageContext';
import AsyncButton from './AsyncButton';
import BarSelector from './BarSelector';

const FeedbackPage: React.FunctionComponent = () => {
  const appCtx = React.useContext(ContentAppContext);
  const pageCtx = React.useContext(EloPageContext);

  const [sentiment, setSentiment] = React.useState<string>();
  const [message, setMessage] = React.useState('');
  const [anonymous, setAnonymous] = React.useState(false);
  const [emailInterest, setEmailInterest] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [submitState, setSubmitState] = React.useState<'not-started' | 'loading' | 'success' | Error>('not-started');
  const [autoReply, setAutoReply] = React.useState<string>();

  const emojis = ['😡', '🙁', '🤷', '🙂', '😀'];
  const positiveEmojis = ['🙂', '😀'];
  const negativeEmojis = ['😡', '🙁'];

  if (autoReply !== undefined) {
    return <div className="feedback">
      <div className="result">
        <div>{autoReply}</div>
        <div className="footer">
          <div
            className="button"
            onClick={() => {
              const page = (pageCtx.config.featureFlags.authEnabled
                ? 'WelcomePage'
                : 'OverviewPage'
              );

              pageCtx.update({ page });
            }}
          >
            Close
          </div>
        </div>
      </div>
    </div>;
  }

  return <div className="feedback">
    <h1>Feedback</h1>

    <div className="question">
      Thanks for taking a moment to do this. It means a lot to us.
    </div>

    <div className="question emoji">
      <div>
        How do you feel about Elo in this moment?
      </div>
      <BarSelector
        options={emojis}
        onSelect={emoji => setSentiment(emoji)}
      />
    </div>

    <div className="question">
      <div>
        Is there anything specific you'd like to say?
      </div>
      <div>
        <textarea onInput={(evt: React.ChangeEvent<HTMLTextAreaElement>) => {
          setMessage(evt.target.value);
        }}></textarea>
      </div>
    </div>

    <div className="question">
      <div>
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

    {anonymous && <div className="question">
      Ok, we won't link this feedback with your account.
    </div>}

    <div className="question" style={{
      display: anonymous ? 'none' : '',
    }}>
      <div>
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
    </div>

    {!anonymous && emailInterest && <div className="question">
      <div>
        We can't guarantee this, but we'll try. What's your email?
      </div>
      <input type="text" style={{ width: '100%' }} onInput={(evt: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(evt.target.value);
      }} />
    </div>}

    <div className="footer">
      <AsyncButton onClick={async () => {
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
  </div>;
};

export default FeedbackPage;
