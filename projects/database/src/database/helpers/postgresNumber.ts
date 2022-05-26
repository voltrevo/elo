import * as io from 'io-ts';

/**
 * postgres returns numbers as strings (or at least the nodejs driver does) so we need this to
 * check the string is a good number representation and return the number
 */
const postgresNumber = new io.Type<number, number | string, unknown>(
  'postgresNumber',
  (u): u is number => typeof u === 'number',
  (u, c) => {
    if (typeof u === 'number') {
      return io.success(u);
    }

    if (typeof u === 'string') {
      const trimmed = u.trim();
      const convertedNumber = Number(trimmed);

      if (
        Number.isFinite(convertedNumber) ||
        ['NaN', 'Infinity', '-Infinity'].includes(trimmed)
      ) {
        return io.success(convertedNumber);
      }
    }

    return io.failure(u, c);
  },
  a => a,
);

export default postgresNumber;
