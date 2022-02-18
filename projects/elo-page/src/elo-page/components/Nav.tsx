import { Article, ChartLine, Gear, House, PresentationChart, Question, TrendUp } from 'phosphor-react';
import * as react from 'react';

import NavLink from './NavLink';

const Nav: react.FunctionComponent = () => {
  return <div className="nav">
    <div className="logo-box"/>

    <div className="links">
      <NavLink selected={false} icon={<ChartLine size={24}/>}>Overview</NavLink>
      <NavLink selected={true} icon={<PresentationChart size={24}/>}>Reports</NavLink>
      <NavLink selected={false} icon={<Gear size={24}/>}>Settings</NavLink>
      <NavLink selected={false} icon={<Question size={24}/>}>Feedback</NavLink>
    </div>
  </div>;
};

export default Nav;
