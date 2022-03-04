import 'source-map-support/register';

import util from 'util';

export default async function launch(
  fn: (emit_: (value: unknown) => void) => Promise<unknown>,
) {
  function emit(value: unknown) {
    // eslint-disable-next-line no-console
    console.log(util.inspect(value, false, 100, true));
  }

  try {
    const result = await fn(emit);
    emit(result);
  } catch (err) {
    setTimeout(() => { throw err; });
  }
}