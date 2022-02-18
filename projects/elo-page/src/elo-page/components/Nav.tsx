import * as react from 'react';

import NavLink from './NavLink';

const Nav: react.FunctionComponent = () => {
  return <div className="nav">
    <div className="logo-box"/>

    <div className="links">
      <NavLink selected={false}>Overview</NavLink>
      <NavLink selected={true}>Reports</NavLink>
      <NavLink selected={false}>Settings</NavLink>
      <NavLink selected={false}>Feedback</NavLink>
    </div>
  </div>;
};

export default Nav;
