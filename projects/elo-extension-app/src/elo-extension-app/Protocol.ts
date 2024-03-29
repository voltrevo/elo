import * as io from 'io-ts';

import { AnalysisFragment } from '../elo-types/Analysis';
import Feedback from '../elo-types/Feedback';
import UiState from './UiState';
import { GoogleAuthResult } from '../elo-types/GoogleAuthResult';
import AccountRoot from './deviceStorage/AccountRoot';
import AggregateStats from '../elo-types/AggregateStats';
import nil from '../common-pure/nil';
import Settings from './sharedStorageTypes/Settings';
import SessionStats from '../elo-types/SessionStats';
import IBackendApi from './IBackendApi';
import AsyncReturnType from '../common-pure/AsyncReturnType';

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

export type SessionPage = {
  entries: {
    id: string,
    session: SessionStats,
  }[],
  nextId?: string,
};

export type Protocol = {
  notifyGetUserMediaCalled(): void;
  addFragment(fragment: AnalysisFragment): void;
  addConnectionEvent(evt: ConnectionEvent): void;
  getUiState(afterIndex: number): UiState;
  getDashboardUrl(): string;
  getSessionToken(): string | nil;
  sendVerificationEmail(email: string): void;
  checkVerificationEmail(email: string, code: string): { verified: boolean };
  register(registration: ProtocolRegistration): string;
  login(credentials: ProtocolLoginCredentials): string;
  sendFeedback(feedback: Feedback): string;
  googleAuth(): GoogleAuthResult;
  logout(): void;
  getEmail(): string | nil;
  readAccountRoot(): AccountRoot | nil;
  writeAccountRoot(newAccountRoot: AccountRoot): void;
  getAggregateStats(): AggregateStats;
  readSettings(): Settings | nil;
  writeSettings(settings: Settings): void;
  getSessionCount(from?: number, to?: number): number;
  getSessionPage(pageSize: number, pageNumber: number): SessionPage;
  getSessionRange(opt: { minTime?: number, maxTime?: number }): SessionStats[];
  getSession(sessionId: string): SessionStats | nil;
  isStaffMember(): boolean;
  getMonthlyStats(): AsyncReturnType<IBackendApi['monthlyStats']>;
  upgrade(): void;
  connectZoom(zoomAuthCode: string): string;
  lookupZoomEmail(): string | nil;
  disconnectZoom(): void;
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
  readAccountRoot: true,
  writeAccountRoot: true,
  getAggregateStats: true,
  readSettings: true,
  writeSettings: true,
  getSessionCount: true,
  getSessionPage: true,
  getSessionRange: true,
  getSession: true,
  isStaffMember: true,
  getMonthlyStats: true,
  upgrade: true,
  connectZoom: true,
  lookupZoomEmail: true,
  disconnectZoom: true,
};

export const protocolThirdPartyKeyMap = {
  notifyGetUserMediaCalled: true,
  addFragment: true,
  addConnectionEvent: true,
  getUiState: true,
  getDashboardUrl: true,
  getSessionToken: true,
  upgrade: true,
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
