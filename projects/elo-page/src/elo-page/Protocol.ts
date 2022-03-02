import * as io from 'io-ts';

import { AnalysisFragment } from '../elo-types/Analysis';
import Registration from '../elo-types/Registration';
import LoginCredentials from '../elo-types/LoginCredentials';
import Feedback from '../elo-types/Feedback';
import UiState from './UiState';

export const GoogleAuthResult = io.type({
  token: io.string,
  detail: io.type({
    issued_to: io.string,
    expires_in: io.number,
    email: io.string,
    verified_email: io.boolean,
  }),
});

export type GoogleAuthResult = io.TypeOf<typeof GoogleAuthResult>;

export type Protocol = {
  notifyGetUserMediaCalled(): void;
  addFragment(fragment: AnalysisFragment): void;
  addConnectionEvent(evt: ConnectionEvent): void;
  getUiState(afterIndex: number): UiState;
  getDashboardUrl(): string;
  getSessionToken(): string | undefined;
  sendVerificationEmail(email: string): void;
  checkVerificationEmail(email: string, code: string): boolean;
  register(registration: Registration): string;
  login(credentials: LoginCredentials): string;
  sendFeedback(feedback: Feedback): string;
  googleAuth(): GoogleAuthResult;
  logout(): void;

  // TODO: This cannot be allowed on third party pages. (Probably others too.)
  getEmail(): string | undefined;
};

export const protocolKeyMap: Record<keyof Protocol, true> = {
  notifyGetUserMediaCalled: true,
  addFragment: true,
  addConnectionEvent: true,
  getUiState: true,
  getDashboardUrl: true,
  getSessionToken: true,
  sendVerificationEmail: true,
  checkVerificationEmail: true,
  register: true,
  login: true,
  sendFeedback: true,
  googleAuth: true,
  logout: true,
  getEmail: true,
};

export type ConnectionEvent = (
  | 'connecting'
  | 'reconnecting'
  | 'connected'
);

type Promisify<T> = T extends Promise<unknown> ? T : Promise<T>;
type Unwrap<T> = T extends { wrap: unknown } ? T['wrap'] : never;
type PromisishImpl<T> = T extends { wrap: Promise<unknown> } ? T['wrap'] : Unwrap<T> | Promise<Unwrap<T>>;
type Promisish<T> = PromisishImpl<{ wrap: T }>;

type PromisifyMethod<M> = M extends (...args: infer Args) => infer Result
  ? (...args: Args) => Promisify<Result>
  : M;

type PromisishMethod<M> = M extends (...args: infer Args) => infer Result
  ? (...args: Args) => Promisish<Result>
  : M;

export type PromisifyApi<Api> = {
  [K in keyof Api]: PromisifyMethod<Api[K]>;
};

export type PromisishApi<Api> = {
  [K in keyof Api]: PromisishMethod<Api[K]>;
};

export default Protocol;
