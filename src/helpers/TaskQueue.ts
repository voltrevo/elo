export default class TaskQueue {
  #tasks: (() => void)[] = [];

  push(task: () => void) {
    this.#tasks.push(task);
  }

  run() {
    while (true) {
      const task = this.#tasks.shift();

      if (task === undefined) {
        break;
      }

      try {
        task();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  }
}
