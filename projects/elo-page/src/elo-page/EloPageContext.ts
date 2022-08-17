import { EventEmitter } from 'events';

import * as React from 'react';
import TypedEventEmitter from 'typed-emitter';
import type { Config } from './config';

import DeviceStorage from '../elo-extension-app/deviceStorage/DeviceStorage';
import SessionStats from '../elo-types/SessionStats';
import nil from '../common-pure/nil';
import AggregateStats from '../elo-types/AggregateStats';

type EloPageContext = ReturnType<typeof initEloPageContext>;

export function initEloPageContext(
  deviceStorage: DeviceStorage,
  featureFlags: Config['featureFlags'],
  initialHash: string,
) {
  const state = {
    hash: initialHash,
    dialog: undefined as (React.ReactNode | nil),
    test: 37,
    needsAuth: false,
    cachedSession: undefined as ({ id: string, session: SessionStats | nil } | nil),
    rangeReport: nil as nil | {
      fromDate: Date;
      toDate: Date;
      stats: AggregateStats;
    },
  };

  const events = new EventEmitter() as TypedEventEmitter<{ update(): void }>;

  const context = {
    events,
    deviceStorage,
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
