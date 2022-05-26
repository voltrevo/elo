import { ChartLine, GearSix, PresentationChart, Question, Star, User, UsersFour } from 'phosphor-react';
import * as react from 'react';
import EloPageContext, { useEloPageContext } from '../EloPageContext';
import ExtensionAppContext from '../ExtensionAppContext';

import NavLink from './NavLink';

const Nav: react.FunctionComponent = () => {
  const appCtx = react.useContext(ExtensionAppContext);
  const pageCtx = react.useContext(EloPageContext);
  const hash = useEloPageContext(s => s.hash);
  const needsAuth = useEloPageContext(s => s.needsAuth);
  const [isStaffMember, setIsStaffMember] = react.useState<boolean>();

  react.useEffect(() => {
    (async () => {
      setIsStaffMember(await appCtx.isStaffMember());
    })();
  }, [needsAuth]);

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

  if (isStaffMember) {
    links.push({
      text: 'User Stats',
      hash: 'UserStatsPage',
      icon: <UsersFour size={24}/>,
    });
  }

  return <div className="nav">
    <div className="logo-box"/>

    <div className="links">
      {links.map(link => (
        <NavLink
          key={link.text}
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
