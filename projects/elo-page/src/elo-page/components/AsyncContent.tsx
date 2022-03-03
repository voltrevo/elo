import { CircleNotch } from 'phosphor-react';
import * as React from 'react';

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
    return <div>
      <div className="spinner" style={{ display: 'inline-block' }}>
        <CircleNotch size={24}/>
      </div>
    </div>;
  }

  return <>{content.result}</>;
};

export default AsyncContent;
