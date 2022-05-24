import nil from "../../common-pure/nil";

import setTimeoutOrUnload from "./setTimeoutOrUnload";

export default class Throttle {
  lastRun = 0;
  queuedFn?: () => void;

  constructor(public minDelay: number) {}

  maybeRun(fn: () => void) {
    if (this.queuedFn !== nil) {
      this.queuedFn = fn;
      return;
    }

    const now = Date.now();

    if (now - this.lastRun >= this.minDelay) {
      this.lastRun = now;
      fn();
    } else {
      this.queuedFn = fn;

      setTimeoutOrUnload(
        () => this.runQueued(),
        now - this.lastRun,
      );
    }
  }

  private runQueued() {
    if (this.queuedFn !== nil) {
      let fn = this.queuedFn;
      this.queuedFn = nil;
      this.lastRun = Date.now();
      fn();
    }
  }
}
