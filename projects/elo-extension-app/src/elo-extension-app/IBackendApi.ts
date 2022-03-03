import Feedback from "../elo-types/Feedback";

type IBackendApi = {
  generateId(): Promise<string>;

  startSession(body: {
    userId: string;
  }): Promise<string>;

  feedback(body: {
    userId: string;
    feedback: Feedback;
  }): Promise<void>;
};

export default IBackendApi;
