import * as React from 'react';
import delay from '../../../helpers/delay';
import ContentAppContext from '../ContentAppContext';
import EloPageContext from '../EloPageContext';
import RowSelector from './RowSelector';

export type Feedback = {
  sentiment: string | undefined;
  positive: boolean;
  negative: boolean;
  message: string | undefined;
  anonymous: boolean;
  emailInterest: boolean;
  email: string | undefined;
};

const FeedbackDialog: React.FunctionComponent = () => {
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
        {autoReply}
      </div>
      <div className="footer">
        <div
          className="button"
          onClick={() => pageCtx.update({ dialog: '' })}
        >
          Close
        </div>
      </div>
    </div>;
  }

  return <div className="feedback">
    <h1>Feedback</h1>

    <div className="question">
      Thanks for taking a moment to do this. It means a lot to us.
    </div>

    <div className="question">
      <div>
        How do you feel about Elo in this moment?
      </div>
      <RowSelector
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
      <RowSelector
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
      <RowSelector
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
      <div
        className="button"
        onClick={async () => {
          setSubmitState('loading');

          try {
            const sendFeedbackResult = await appCtx.sendFeedback({
              sentiment,
              positive: positiveEmojis.includes(sentiment ?? ''),
              negative: negativeEmojis.includes(sentiment ?? ''),
              message: message || undefined,
              anonymous,
              emailInterest: !anonymous && emailInterest,
              email: anonymous ? undefined : email,
            });

            setSubmitState('success');

            await delay(500);

            setAutoReply(sendFeedbackResult);
          } catch (error) {
            setSubmitState(error as Error);
          }
        }}
      >
        Submit
      </div>

      <div>
        {submitState === 'loading' && 'Loading...'}
        {submitState === 'success' && '✅'}
        {submitState instanceof Error && <div className='error'>{submitState.message}</div>}
      </div>
    </div>
  </div>;
};

export default FeedbackDialog;
