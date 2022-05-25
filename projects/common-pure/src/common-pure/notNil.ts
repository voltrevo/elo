import nil from './nil';

export default function notNil<T>(x: T): x is Exclude<T, nil> {
  return x !== nil;
}
