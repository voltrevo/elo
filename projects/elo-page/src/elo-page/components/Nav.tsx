import { ChartLine, Gear, GearSix, PresentationChart, Question, Star, User } from 'phosphor-react';
import * as react from 'react';
import EloPageContext, { useEloPageContext } from '../EloPageContext';

import NavLink from './NavLink';

const Nav: react.FunctionComponent = () => {
  const pageCtx = react.useContext(EloPageContext);
  const hash = useEloPageContext(s => s.hash);
  const needsAuth = useEloPageContext(s => s.needsAuth);

  const links = needsAuth ? [
    {
      text: 'Welcome',
      hash: 'WelcomePage',
      icon: <Star size={24}/>,
    },
    {
      text: 'Feedback',
      hash: 'FeedbackPage',
      icon: <Question size={24}/>,
    },
  ] : [
    {
      text: 'Overview',
      hash: 'OverviewPage',
      icon: <ChartLine size={24}/>,
    },
    {
      text: 'Reports',
      hash: 'ReportsPage',
      icon: <PresentationChart size={24}/>,
    },
    {
      text: 'Settings',
      hash: 'SettingsPage',
      icon: <GearSix size={24}/>,
    },
    {
      text: 'Feedback',
      hash: 'FeedbackPage',
      icon: <Question size={24}/>,
    },
    {
      text: 'Account',
      hash: 'AccountPage',
      icon: <User size={24}/>,
    },
  ];

  return <div className="nav">
    <div className="logo-box"/>

    <div className="links">
      {links.map(link => (
        <NavLink
          icon={link.icon}
          selected={link.hash === hash}
          onClick={() => pageCtx.update({ hash: link.hash })}
        >
          {link.text}
        </NavLink>
      ))}
    </div>
  </div>;
};

export default Nav;
