import { AnalysisFragment } from '../../analyze';
import UiState from './UiState';

type Protocol = {
  notifyGetUserMediaCalled(): void;
  addFragment(fragment: AnalysisFragment): void;
  addConnectionEvent(evt: ConnectionEvent): void;
  getUiState(afterIndex: number): UiState;
  getDashboardUrl(): string;
};

export type ConnectionEvent = (
  | 'connecting'
  | 'reconnecting'
  | 'connected'
);

type Promisify<T> = T extends Promise<unknown> ? T : Promise<T>;
type Promisish<T> = T extends Promise<unknown> ? T : T | Promise<T>;

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
