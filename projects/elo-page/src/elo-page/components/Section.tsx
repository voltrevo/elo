import * as React from 'react';

const Section: React.FunctionComponent = (props) => {
  return <div className="section">{props.children}</div>;
};

export default Section;
