import { EventEmitter } from 'events';

import * as React from 'react';
import TypedEventEmitter from 'typed-emitter';

type EloPageContext = ReturnType<typeof initEloPageContext>;

function initEloPageContext() {
  const state = {
    page: '',
    test: 37,
  };

  const events = new EventEmitter() as TypedEventEmitter<{ update(): void }>;

  const context = {
    ...events,
    state,
    update: (updates: Partial<typeof state>) => {
      for (const key of (Object.keys(updates) as (keyof typeof state)[])) {
        (state as any)[key] = updates[key];
      }
    },
  };

  return context;
}

const EloPageContext = {
  ...React.createContext<EloPageContext>({} as EloPageContext),
  use: <T>(
    extract: (state: EloPageContext['state']) => T,
    compare: (a: T, b: T) => boolean = (a, b) => a === b,
  ): T => {
    const ctx = React.useContext(EloPageContext);
    const [value, setValue] = React.useState(extract(ctx.state));

    React.useEffect(() => {
      const onUpdate = () => {
        const newValue = extract(ctx.state);

        if (!compare(value, newValue)) {
          setValue(newValue);
        }
      };

      ctx.on('update', onUpdate);

      return () => { ctx.off('update', onUpdate); };
    });

    return value;
  },
};

export default EloPageContext;
