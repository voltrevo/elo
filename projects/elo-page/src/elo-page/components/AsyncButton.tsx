import { CheckCircle, Circle, CircleNotch, XCircle } from 'phosphor-react';
import * as react from 'react';

import Button from './Button';

type Props = {
  enabled?: boolean;
  primary?: boolean;
  onClick: () => Promise<void>;
  defaultResult?: 'success' | 'error';
};

const AsyncButton: react.FunctionComponent<Props> = (props) => {
  const [loading, setLoading] = react.useState(false);
  const [result, setResult] = react.useState<'success' | 'error' | undefined>(props.defaultResult);
  const [errorMessage, setErrorMessage] = react.useState<string>();

  return <Button
    enabled={!loading && props.enabled}
    primary={props.primary}
    onClick={async () => {
      setLoading(true);
      setErrorMessage(undefined);

      try {
        await props.onClick();
        setResult('success');
      } catch (e) {
        setResult('error');
        setErrorMessage((e as Error).message);
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
            <CircleNotch size={24} />
          </div>;
        }

        if (result !== undefined) {
          return <div style={{ fontSize: '1px' }}>
            {result === 'success'
              ? <CheckCircle size={24} />
              : <XCircle size={24} />
            }
          </div>;
        }

        return <div style={{ fontSize: '1px', opacity: '0.3' }}>
          <Circle size={24} />
        </div>
      })()}
      {result === 'error' && errorMessage !== undefined && (
        <div className="button-error-wrapper">
          <div className="button-error">
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  </Button>
};

export default AsyncButton;
