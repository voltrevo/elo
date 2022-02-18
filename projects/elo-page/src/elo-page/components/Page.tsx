import * as react from 'react';

const Page: react.FunctionComponent = (props) => {
  return <div className="elo-page-container">{props.children}</div>
};

export default Page;
