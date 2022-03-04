import * as io from 'io-ts';

import { AnalysisFragment } from '../elo-types/Analysis';
import Feedback from '../elo-types/Feedback';
import UiState from './UiState';
import { GoogleAuthResult } from '../elo-types/GoogleAuthResult';

const ProtocolRegistration = io.union([
  io.type({
    email: io.string,
    password: io.string,
    code: io.string,
  }),
  io.type({
    googleAccessToken: io.string,
  }),
]);

export type ProtocolRegistration = io.TypeOf<typeof ProtocolRegistration>;

export type ProtocolLoginCredentials = (
  | { email: string; password: string }
  | { googleAccessToken: string }
);

export type Protocol = {
  notifyGetUserMediaCalled(): void;
  addFragment(fragment: AnalysisFragment): void;
  addConnectionEvent(evt: ConnectionEvent): void;
  getUiState(afterIndex: number): UiState;
  getDashboardUrl(): string;
  getSessionToken(): string | undefined;
  sendVerificationEmail(email: string): void;
  checkVerificationEmail(email: string, code: string): boolean;
  register(registration: ProtocolRegistration): string;
  login(credentials: ProtocolLoginCredentials): string;
  sendFeedback(feedback: Feedback): string;
  googleAuth(): GoogleAuthResult;
  logout(): void;
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

export const protocolThirdPartyKeyMap = {
  notifyGetUserMediaCalled: true,
  addFragment: true,
  addConnectionEvent: true,
  getUiState: true,
  getDashboardUrl: true,
  getSessionToken: true,
};

export type ThirdPartyProtocol = {
  [K in (keyof typeof protocolThirdPartyKeyMap)]: Protocol[K];
};

export type ConnectionEvent = (
  | 'connecting'
  | 'reconnecting'
  | 'connected'
);

export default Protocol;
