import * as React from 'react';

import Button from '../../elo-page/components/Button';
import App from './App';

let getUserMediaCalled = false;

const ZoomExternalCapture: React.FunctionComponent = () => {
  if (getUserMediaCalled === false) {
    setTimeout(() => {
      navigator.mediaDevices.getUserMedia({ audio: true });
    }, 100);

    getUserMediaCalled = true;
  }

  return <>
    <div className="prompt">
      <div className="question">&nbsp;</div>
      <div className="button-row">
        <Button primary={false} onClick={() => window.close()}>Finish</Button>
      </div>
    </div>
    <App/>
  </>;
}

export default ZoomExternalCapture;
