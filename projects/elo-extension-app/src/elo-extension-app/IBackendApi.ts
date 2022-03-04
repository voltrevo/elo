import Feedback from "../elo-types/Feedback";
import LoginCredentials from "../elo-types/LoginCredentials";
import Registration from "../elo-types/Registration";

export type LoginResult = {
  userId: string;
  email: string;
  googleAccount?: string;
};

type IBackendApi = {
  generateId(): Promise<string>;

  startSession(body: {
    userId: string;
  }): Promise<string>;

  feedback(body: {
    userId: string;
    feedback: Feedback;
  }): Promise<void>;

  passwordHardeningSalt(body: {
    email: string,

    // TODO: Make sure the ability to learn whether accounts exist or have changed from this api is
    // limited.
    userIdHint?: {
      verificationCode: string,
      userId: string,
    },
  }): Promise<string>;

  register(body: Registration): Promise<LoginResult>;
  login(body: LoginCredentials): Promise<LoginResult>;
};

export default IBackendApi;
