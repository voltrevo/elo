import * as io from 'io-ts';
import decode from '../../elo-types/decode';
import hardenPassword from './hardenPassword';

const Args = io.tuple([io.string, io.string, io.string, io.number]);

onmessage = (evt) => {
  try {
    const [
      domain,
      userId,
      password,
      iterations,
    ] = decode(Args, evt.data);

    const result = hardenPassword(domain, userId, password, iterations);

    postMessage({ value: result });
  } catch (error) {
    postMessage({ error });
  }
};
