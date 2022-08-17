import * as React from 'react';

export default function onEnter(handler: (evt: React.KeyboardEvent) => void) {
  return {
    onKeyDown: (evt: React.KeyboardEvent) => {
      if (evt.key === 'Enter') {
        handler(evt);
      }
    }
  }
}
