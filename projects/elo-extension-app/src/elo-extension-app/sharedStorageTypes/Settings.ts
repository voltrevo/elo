import * as io from 'io-ts';
import optional from '../../elo-types/optional';

const Settings = io.type({
  liveStatsMode: io.string,

  // No longer used
  experimentalZoomSupport: optional(io.literal(true)),
  zoomRedirectToWebClient: optional(io.boolean),
});

type Settings = io.TypeOf<typeof Settings>;

export const defaultSettings: Settings = {
  liveStatsMode: 'count',
  experimentalZoomSupport: undefined,
  zoomRedirectToWebClient: undefined,
};

export default Settings;
