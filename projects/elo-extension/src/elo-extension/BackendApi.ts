import IBackendApi from "../elo-extension-app/IBackendApi";
import Feedback from "../elo-types/Feedback";

export default class BackendApi implements IBackendApi {
  constructor(public apiBase: string) {}

  async generateId(): Promise<string> {
    return await fetch(`${this.apiBase}/generateId`, { method: 'POST' })
        .then(res => res.text());
  }

  async startSession(body: { userId: string; }): Promise<string> {
    return await fetch(`${this.apiBase}/startSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    }).then(res => res.text());
  }

  async feedback(body: { userId: string; feedback: Feedback }): Promise<void> {
    const feedbackResponse = await fetch(`${this.apiBase}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });

    if (feedbackResponse.status !== 200) {
      throw new Error(await feedbackResponse.text());
    }
  }
}
