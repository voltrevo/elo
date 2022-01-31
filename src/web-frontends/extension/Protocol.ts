import { AnalysisFragment } from '../../analyze';
import UiState from './UiState';

type Protocol = {
  notifyGetUserMediaCalled(): void;
  addFragment(fragment: AnalysisFragment): void;
  addConnectionEvent(evt: ConnectionEvent): void;
  getUiState(afterIndex: number): UiState;
  getDashboardUrl(): string;
  getSessionToken(): string | undefined;
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
