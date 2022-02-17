export default class ErrorData<Type extends string = string, Detail = unknown> {
  private _nominalGuard?: undefined;
  stack: string;

  constructor(public type: Type, public detail: Detail, public parents: unknown[]) {
    const firstParent = parents[0];

    if (
      parents.length === 1 &&
      typeof firstParent === 'object' &&
      firstParent !== null &&
      'stack' in firstParent &&
      typeof (firstParent as { stack: unknown }).stack === 'undefined'
    ) {
      this.stack = (firstParent as { stack: string }).stack;
    } else {
      this.stack = new Error().stack ?? '(runtime did not generate stack)';
    }
  }
}
