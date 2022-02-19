import { Check, Spinner, X } from 'phosphor-react';
import * as react from 'react';

import Button from './Button';

type Props = {
  enabled?: boolean;
  onClick: () => Promise<void>;
  defaultResult?: 'success' | 'error';
};

const AsyncButton: react.FunctionComponent<Props> = (props) => {
  const [loading, setLoading] = react.useState(false);
  const [result, setResult] = react.useState<'success' | 'error' | undefined>(props.defaultResult);

  return <Button
    enabled={!loading && props.enabled}
    onClick={async () => {
      setLoading(true);

      try {
        await props.onClick();
        setResult('success');
      } catch {
        setResult('error');
      } finally {
        setLoading(false);
      }
    }}
  >
    <div>
      <div>{props.children}</div>
      {(() => {
        if (loading) {
          return <div className="spinner">
            <Spinner size={24} />
          </div>;
        }

        if (result !== undefined) {
          return <div style={{ fontSize: '1px' }}>
            {result === 'success'
              ? <Check size={24} />
              : <X size={24} />
            }
          </div>;
        }

        return <></>;
      })()}
    </div>
  </Button>
};

export default AsyncButton;
