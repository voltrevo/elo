import { EventEmitter } from 'events';

import * as React from 'react';
import TypedEventEmitter from 'typed-emitter';

import Storage from './storage/Storage';

type EloPageContext = ReturnType<typeof initEloPageContext>;

export function initEloPageContext() {
  const state = {
    page: '',
    test: 37,
  };

  const events = new EventEmitter() as TypedEventEmitter<{ update(): void }>;

  const context = {
    events,
    storage: new Storage('elo'),
    state,
    update: (updates: Partial<typeof state>) => {
      for (const key of (Object.keys(updates) as (keyof typeof state)[])) {
        (state as any)[key] = updates[key];
      }

      events.emit('update');
    },
  };

  return context;
}

const EloPageContext = React.createContext<EloPageContext>({} as EloPageContext);

export function useEloPageContext<T>(
  extract: (state: EloPageContext['state']) => T,
  compare: (a: T, b: T) => boolean = (a, b) => a === b,
): T {
  const ctx = React.useContext(EloPageContext);
  const [value, setValue] = React.useState(extract(ctx.state));

  React.useEffect(() => {
    const onUpdate = () => {
      const newValue = extract(ctx.state);

      if (!compare(value, newValue)) {
        setValue(newValue);
      }
    };

    ctx.events.on('update', onUpdate);

    return () => { ctx.events.off('update', onUpdate); };
  });

  return value;
}

export default EloPageContext;
