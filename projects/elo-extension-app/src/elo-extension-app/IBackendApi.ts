import * as io from 'io-ts';

import backendApiSpec from "../elo-types/backendApiSpec";
import ZoomBackendRpc from './ZoomBackendRpc';

type Spec = typeof backendApiSpec;

const LoginResult = backendApiSpec.login.Response;
type LoginResult = io.TypeOf<typeof LoginResult>;

export { LoginResult };

type IBackendApi = {
  [Path in keyof Spec]: (
    body: io.TypeOf<Spec[Path]["Request"]>,
  ) => Promise<io.TypeOf<Spec[Path]["Response"]>>
};

export default IBackendApi;
