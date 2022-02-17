import { EventEmitter } from 'events';

import * as React from 'react';
import TypedEventEmitter from 'typed-emitter';

type PageContext = ReturnType<typeof initPageContext>;

export function initPageContext() {
  const state = {
    page: 'home',
    counter: 0,
  };

  const events = new EventEmitter() as TypedEventEmitter<{ update(): void }>;

  const context = {
    events,
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

const PageContext = React.createContext<PageContext>({} as PageContext);

export function usePageContext<T>(
  extract: (state: PageContext['state']) => T,
  compare: (a: T, b: T) => boolean = (a, b) => a === b,
): T {
  const ctx = React.useContext(PageContext);
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

export default PageContext;
