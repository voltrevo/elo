import ExplicitAny from './ExplicitAny';
import nil from './nil';

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

  let res: Record<string, unknown> = {};

  for (const key of Object.keys(value)) {
    res[key] = deepNullToNil((value as ExplicitAny)[key]);
  }

  return res;
}
