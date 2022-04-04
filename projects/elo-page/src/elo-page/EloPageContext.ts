import { EventEmitter } from 'events';

import * as React from 'react';
import TypedEventEmitter from 'typed-emitter';
import type { Config } from './config';

import Storage from '../elo-extension-app/storage/Storage';
import SessionStats from '../elo-types/SessionStats';

type EloPageContext = ReturnType<typeof initEloPageContext>;

export function initEloPageContext(
  storage: Storage,
  featureFlags: Config['featureFlags'],
  initialPage: string,
) {
  const state = {
    page: initialPage,
    dialog: undefined as (React.ReactNode | undefined),
    test: 37,
    needsAuth: false,
    session: undefined as (SessionStats | undefined),
  };

  const events = new EventEmitter() as TypedEventEmitter<{ update(): void }>;

  const context = {
    events,
    storage,
    state,
    featureFlags,
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
  let lastValue = value;

  React.useEffect(() => {
    const onUpdate = () => {
      const newValue = extract(ctx.state);

      if (!compare(lastValue, newValue)) {
        lastValue = newValue;
        setValue(newValue);
      }
    };

    ctx.events.on('update', onUpdate);

    return () => { ctx.events.off('update', onUpdate); };
  }, []);

  return value;
}

export default EloPageContext;
