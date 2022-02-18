import * as react from 'react';

const Nav: react.FunctionComponent = () => {
  return <div className="nav">
    <div className="logo-box"/>

    <div className="links">
      <div className="active">Active Test</div>
      <div>Test</div>
    </div>
  </div>;
};

export default Nav;
