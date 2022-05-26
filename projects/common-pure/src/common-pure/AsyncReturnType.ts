type AsyncReturnType<T extends (...args: any) => any> = (
  ReturnType<T> extends Promise<infer R>
    ? R
    : ReturnType<T>
);

export default AsyncReturnType;
