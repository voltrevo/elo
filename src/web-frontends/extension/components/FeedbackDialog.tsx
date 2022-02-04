import * as React from 'react';

const FeedbackDialog: React.FunctionComponent = () => {
  const emojis = ['😡', '🙁', '🤷', '🙂', '😃'];

  const [selectedEmoji, setSelectedEmoji] = React.useState<string>();

  return <div className="feedback">
    <h1>Feedback</h1>

    <p>
      Thanks for taking a moment to do this. It means a lot to us.
    </p>

    <div className="question">
      <div>
        How do you feel about Elo in this moment?
      </div>
      <div className="emoji-selector">
        {emojis.map(emoji => (
          <div>
            <span
              className={`emoji ${emoji === selectedEmoji && 'selected'}`}
              onClick={() => setSelectedEmoji(emoji === selectedEmoji ? undefined : emoji)}
            >
              {emoji}
            </span>
          </div>
        ))}
      </div>
    </div>

    <div className="question">
      <div>
        Is there anything specific you'd like to say?
      </div>
      <div>
        <textarea></textarea>
      </div>
    </div>
  </div>;
};

export default FeedbackDialog;
