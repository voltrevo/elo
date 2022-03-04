import * as io from 'io-ts';
import decode from '../../elo-types/decode';
import hardenPassword from './hardenPassword';

const Args = io.tuple([io.string, io.string, io.number]);

onmessage = (evt) => {
  try {
    const [
      password,
      salt,
      iterations,
    ] = decode(Args, evt.data);

    const result = hardenPassword(password, salt, iterations);

    postMessage({ value: result });
  } catch (error) {
    postMessage({ error });
  }
};
