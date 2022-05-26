import * as React from 'react';

const Field: React.FunctionComponent = ({ children }) => {
  return <div className="field">
    {(() => {
      if (Array.isArray(children)) {
        return children.map((child, i) => <div key={i}>{child}</div>);
      }
    })()}
  </div>;
};

export default Field;
