import * as react from 'react';

const Nav: react.FunctionComponent = () => {
  return <div className="nav">
    <div className="logo-box"/>

    <div className="links">
      <div>Overview</div>
      <div className="active">Reports</div>
      <div>Settings</div>
      <div>Feedback</div>
    </div>
  </div>;
};

export default Nav;
