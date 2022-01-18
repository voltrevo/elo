import { ConfigType } from '../../helpers/ConfigType';

const configApiJson = JSON.parse(process.env.ELO_CONFIG_API ?? '{}');

const decodeResult = ConfigType.props.api.decode(configApiJson);

if ('left' in decodeResult) {
  throw new Error(decodeResult.left.map(e => e.message ?? '').join('\n'));
}

export default decodeResult.right;
