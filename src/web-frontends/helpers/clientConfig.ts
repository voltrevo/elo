import reporter from 'io-ts-reporters';

import { ConfigType } from '../../helpers/ConfigType';

const configApiJson = JSON.parse(process.env.ELO_CONFIG_API ?? '{}');

const decodeResult = ConfigType.props.client.decode(configApiJson);

if ('left' in decodeResult) {
  throw new Error(reporter.report(decodeResult).join('\n'));
}

export default decodeResult.right;
