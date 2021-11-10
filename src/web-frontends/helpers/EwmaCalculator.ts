export default class EwmaCalculator {
  value = 0;

  constructor(
    public windowDuration: number,
    public decayWindowDuration: number,
  ) {}

  observe(value: number) {
    this.value += value * this.windowDuration / this.decayWindowDuration;
  }

  timeDecay(dt: number) {
    this.value *= Math.exp(-dt / this.decayWindowDuration);
  }
}
