import * as React from 'react';
import never from '../../common-pure/never';
import Button from '../../elo-page/components/Button';
import App from './App';

const ZoomExternalCapture: React.FunctionComponent = () => {
  const [state, setState] = React.useState<'question' | 'confirm' | 'active'>('question')

  if (state === 'question') {
    return <div className="elo-page zoom-external-capture">
      <div className="prompt">
        <div className="question">Use Elo during your Zoom meeting?</div>
        <div className="button-row">
          <Button primary={false} onClick={() => {
            window.close();
          }}>No</Button>
          <Button primary={true} onClick={() => setState('confirm')}>Yes</Button>
        </div>
      </div>
    </div>;
  }

  if (state === 'confirm') {
    return <div className="elo-page zoom-external-capture">
      <div className="prompt">
        <div className="question">Elo will keep running until you close this window.</div>
        <div className="button-row">
          <Button primary={true} onClick={() => setState('active')}>I Understand</Button>
        </div>
      </div>
    </div>;
  }

  if (state === 'active') {
    setTimeout(() => {
      navigator.mediaDevices.getUserMedia({ audio: true });
    }, 100);
    return <App/>;
  }

  never(state);
}

export default ZoomExternalCapture;
