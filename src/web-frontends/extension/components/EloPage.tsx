import * as React from 'react';
import EloPageContext, { useEloPageContext } from '../EloPageContext';

const EloPage: React.FunctionComponent = () => {
  const test = useEloPageContext(state => state.test);

  const ctx = React.useContext(EloPageContext);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      ctx.update({ test: ctx.state.test + 1 });
    }, 1000);

    return () => { clearInterval(intervalId); };
  });

  return <>{test}</>;
};

export default EloPage;
