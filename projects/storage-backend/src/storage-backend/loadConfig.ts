import decode from "../elo-types/decode";
import Config from "./Config";

const rawConfig = require('../../../config.json');

export default function loadConfig() {
  return decode(Config, rawConfig);
}
