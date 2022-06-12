import { CircleNotch } from 'phosphor-react';
import * as React from 'react';

const LoadingSpinner: React.FunctionComponent = () => {
  return <div>
    <div className="spinner" style={{ display: 'inline-block' }}>
      <CircleNotch size={24}/>
    </div>
  </div>;
};

export default LoadingSpinner;
