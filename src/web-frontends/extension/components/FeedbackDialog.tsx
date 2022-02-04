import * as React from 'react';
import RowSelector from './RowSelector';

const FeedbackDialog: React.FunctionComponent = () => {
  const [sentiment, setSentiment] = React.useState<string>();
  const [message, setMessage] = React.useState('');
  const [anonymous, setAnonymous] = React.useState(false);
  const [emailInterest, setEmailInterest] = React.useState(false);
  const [email, setEmail] = React.useState('');

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
        options={['😡', '🙁', '🤷', '🙂', '😀']}
        onSelect={emoji => setSentiment(emoji)}
      />
    </div>

    <div className="question">
      <div>
        Is there anything specific you'd like to say?
      </div>
      <div>
        <textarea></textarea>
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
      <input type="text" style={{ width: '100%' }} />
    </div>}

    <div className="submit-container">
      <div className="submit-button">
        Submit
      </div>
    </div>
  </div>;
};

export default FeedbackDialog;
