import { CircleNotch } from 'phosphor-react';
import * as React from 'react';
import LoadingSpinner from './LoadingSpinner';

type Props = {
  load: () => Promise<React.ReactNode>;
};

const AsyncContent: React.FunctionComponent<Props> = ({ load }) => {
  const [content, setContent] = React.useState<{ result: React.ReactNode }>();

  React.useEffect(() => {
    load().then(result => {
      setContent({ result });
    });
  }, [load]);

  if (!content) {
    return <LoadingSpinner/>;
  }

  return <>{content.result}</>;
};

export default AsyncContent;
