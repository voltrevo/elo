import ExplicitAny from './ExplicitAny';
import nil from './nil';

const nullPrototype = Object.getPrototypeOf({});

export default function deepNullToNil(value: unknown): unknown {
  if (typeof value !== 'object') {
    return value;
  }

  if (value === null) {
    return nil;
  }

  if (Array.isArray(value)) {
    return value.map(deepNullToNil);
  }

  if (Object.getPrototypeOf(value) === nullPrototype) {
    let res: Record<string, unknown> = {};

    for (const key of Object.keys(value)) {
      res[key] = deepNullToNil((value as ExplicitAny)[key]);
    }
  
    return res;
  }

  return value;
}
