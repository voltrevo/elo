import * as io from 'io-ts';

import Feedback from './Feedback';
import LoginCredentials from './LoginCredentials';
import optional from './optional';
import PasswordHardeningSaltRequest from './PasswordHardeningSaltRequest';
import Registration from './Registration';

const LoginResult = io.type({
  userId: io.string,
  email: io.string,
  googleAccount: optional(io.string),
});

const backendApiSpec = {
  generateId: {
    Request: io.unknown,
    Response: io.string,
  },

  startSession: {
    Request: io.type({
      userId: optional(io.string),
    }),
    Response: io.string,
  },

  feedback: {
    Request: io.type({
      userId: io.string,
      feedback: Feedback,
    }),
    Response: io.undefined,
  },

  passwordHardeningSalt: {
    Request: PasswordHardeningSaltRequest,
    Response: io.type({
      passwordHardeningSalt: io.string,
    }),
  },

  register: {
    Request: Registration,
    Response: LoginResult,
  },

  login: {
    Request: LoginCredentials,
    Response: LoginResult,
  },
};

export default backendApiSpec;
