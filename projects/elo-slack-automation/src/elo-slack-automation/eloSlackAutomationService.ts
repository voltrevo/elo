import Service from "../common-backend/Service";
import Config from "./Config";
import run from "./run";

export default Service({
  name: 'elo-slack-automation',
  Config,
  run,
});
