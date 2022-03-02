export type Promisify<T> = T extends Promise<unknown> ? T : Promise<T>;
export type Unwrap<T> = T extends { wrap: unknown } ? T['wrap'] : never;
export type PromisishImpl<T> = T extends { wrap: Promise<unknown> } ? T['wrap'] : Unwrap<T> | Promise<Unwrap<T>>;
export type Promisish<T> = PromisishImpl<{ wrap: T }>;

export type PromisifyMethod<M> = M extends (...args: infer Args) => infer Result
  ? (...args: Args) => Promisify<Result>
  : M;

export type PromisishMethod<M> = M extends (...args: infer Args) => infer Result
  ? (...args: Args) => Promisish<Result>
  : M;

export type PromisifyApi<Api> = {
  [K in keyof Api]: PromisifyMethod<Api[K]>;
};

export type PromisishApi<Api> = {
  [K in keyof Api]: PromisishMethod<Api[K]>;
};
