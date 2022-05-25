export default class Lock {
  promise: Promise<void>;
  private release_?: () => void;

  constructor() {
    this.promise = new Promise(resolve => {
      this.release_ = resolve;
    });
  }

  release() {
    this.release_!();
  }

  async wait() {
    await this.promise;
  }
}
