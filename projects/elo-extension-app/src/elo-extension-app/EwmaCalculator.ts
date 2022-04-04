// TODO: Rename MetricCalculator?
export default class EwmaCalculator {
  value = 0;
  sum = 0;

  constructor(
    public windowDuration: number,
    public decayWindowDuration: number,
  ) {}

  observe(value: number) {
    this.value += value * this.windowDuration / this.decayWindowDuration;
    this.sum += value;
  }

  timeDecay(dt: number) {
    this.value *= Math.exp(-dt / this.decayWindowDuration);
  }

  render(metricPreference?: string) {
    if (metricPreference === 'recentAverage') {
      return this.value.toFixed(1);
    }

    return this.sum.toFixed(0);
  }
}
