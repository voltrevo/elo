import { AnalysisFragment } from '../elo-types/Analysis';
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

  sendVerificationEmail(email: string): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

  checkVerificationEmail(email: string, code: string): boolean | Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  register(email: string, password: string, code: string): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

  login(email: string, password: string): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

  sendFeedback(feedback: { sentiment: string | undefined; positive: boolean; negative: boolean; message: string | undefined; anonymous: boolean; emailInterest: boolean; email: string | undefined; }): string | Promise<string> {
    throw new Error('Method not implemented.');
  }
}
