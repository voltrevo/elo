import delay from '../common-pure/delay';
import { AnalysisFragment } from '../elo-types/Analysis';
import Feedback from '../elo-types/Feedback';
import config from './config';
import Protocol, { ConnectionEvent, PromisishApi } from './Protocol';
import UiState from './UiState';

export default class SimulContentApp implements PromisishApi<Protocol> {
  notifyGetUserMediaCalled(): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

  addFragment(fragment: AnalysisFragment): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

  addConnectionEvent(evt: ConnectionEvent): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

  getUiState(afterIndex: number): UiState | Promise<UiState> {
    throw new Error('Method not implemented.');
  }

  getDashboardUrl(): string | Promise<string> {
    throw new Error('Method not implemented.');
  }

  getSessionToken(): string | Promise<string | undefined> | undefined {
    throw new Error('Method not implemented.');
  }

  async sendVerificationEmail(email: string): Promise<void> {
    await delay(500);
  }

  async checkVerificationEmail(email: string, code: string): Promise<boolean> {
    await delay(500);
    return code === '123456';
  }

  register(email: string, password: string, code: string): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

  login(email: string, password: string): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

  async sendFeedback(feedback: Feedback) {
    await delay(500);

    return "(Feedback response)";
  }

  async googleAuth() {
    await delay(500);

    return {
      issued_to: config.googleOauthClientId,
      expires_in: 3599,
      email: "alice@example.com",
      verified_email: true,
    };
  }

  async googleAuthLogout(): Promise<never> {
    await delay(500);
    throw new Error('Method not implemented.');
  }
}
