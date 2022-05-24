import * as io from 'io-ts';

import permissiveOptional from '../../elo-types/permissiveOptional';

const Settings = io.type({
  liveStatsMode: io.string,
  experimentalZoomSupport: permissiveOptional(io.literal(true)),
  zoomRedirectToWebClient: permissiveOptional(io.boolean),
});

type Settings = io.TypeOf<typeof Settings>;

export const defaultSettings: Settings = {
  liveStatsMode: 'count',
  experimentalZoomSupport: undefined,
  zoomRedirectToWebClient: undefined,
};

export default Settings;
