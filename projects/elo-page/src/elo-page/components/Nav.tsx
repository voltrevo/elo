import { ChartLine, Gear, PresentationChart, Question, Star, User } from 'phosphor-react';
import * as react from 'react';
import EloPageContext, { useEloPageContext } from '../EloPageContext';

import NavLink from './NavLink';

const Nav: react.FunctionComponent = () => {
  const pageCtx = react.useContext(EloPageContext);
  const page = useEloPageContext(s => s.page);
  const needsAuth = useEloPageContext(s => s.needsAuth);

  const links = needsAuth ? [
    {
      text: 'Welcome',
      page: 'WelcomePage',
      icon: <Star size={24}/>,
    },
    {
      text: 'Feedback',
      page: 'FeedbackPage',
      icon: <Question size={24}/>,
    },
  ] : [
    {
      text: 'Overview',
      page: 'OverviewPage',
      icon: <ChartLine size={24}/>,
    },
    {
      text: 'Reports',
      page: 'ReportsPage',
      icon: <PresentationChart size={24}/>,
    },
    {
      text: 'Settings',
      page: 'SettingsPage',
      icon: <Gear size={24}/>,
    },
    {
      text: 'Account',
      page: 'AccountPage',
      icon: <User size={24}/>,
    },
    {
      text: 'Feedback',
      page: 'FeedbackPage',
      icon: <Question size={24}/>,
    },
  ];

  return <div className="nav">
    <div className="logo-box"/>

    <div className="links">
      {links.map(link => (
        <NavLink
          icon={link.icon}
          selected={link.page === page}
          onClick={() => pageCtx.update({ page: link.page })}
        >
          {link.text}
        </NavLink>
      ))}
    </div>
  </div>;
};

export default Nav;
