import * as React from 'react';
import ContentAppContext from '../ContentAppContext';
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

  const [sentiment, setSentiment] = React.useState<string>();
  const [message, setMessage] = React.useState('');
  const [anonymous, setAnonymous] = React.useState(false);
  const [emailInterest, setEmailInterest] = React.useState(false);
  const [email, setEmail] = React.useState('');

  const emojis = ['😡', '🙁', '🤷', '🙂', '😀'];
  const positiveEmojis = ['🙂', '😀'];
  const negativeEmojis = ['😡', '🙁'];

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

    <div className="submit-container">
      <div
        className="submit-button"
        onClick={async () => {
          const autoReply = await appCtx.sendFeedback({
            sentiment,
            positive: positiveEmojis.includes(sentiment ?? ''),
            negative: negativeEmojis.includes(sentiment ?? ''),
            message: message || undefined,
            anonymous,
            emailInterest: !anonymous && emailInterest,
            email: anonymous ? undefined : email,
          });

          console.log(autoReply);
        }}
      >
        Submit
      </div>
    </div>
  </div>;
};

export default FeedbackDialog;
