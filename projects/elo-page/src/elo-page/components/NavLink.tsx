import { Question } from 'phosphor-react';
import * as react from 'react';

type Props = {
  selected: boolean;
};

const NavLink: react.FunctionComponent<Props> = (props) => {
  return <div className={`nav-link ${props.selected && 'selected'}`}>
    <div className="icon-outer">
      <div className="icon-inner">
        <Question size={24} />
      </div>
    </div>
    <div className="content">{props.children}</div>
  </div>;
};

export default NavLink;
