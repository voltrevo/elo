import * as io from 'io-ts';
import reporter from 'io-ts-reporters';

const Config = io.type({
  sampleKey: io.string,
});

const configJson = JSON.parse(process.env.CLIENT_CONFIG ?? '{}');

const decodeResult = Config.decode(configJson);

if ('left' in decodeResult) {
  throw new Error(reporter.report(decodeResult).join('\n'));
}

if (decodeResult.right === undefined) {
  throw new Error('Missing client config');
}

const config = decodeResult.right;

export default config;
