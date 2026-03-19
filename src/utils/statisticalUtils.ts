export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const idx = (arr.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return arr[lo];
  const w = idx - lo;
  return arr[lo] * (1 - w) + arr[hi] * w;
}

export function linearTrendSlope(series: number[]): number {
  if (series.length < 2) return 0;
  const n = series.length;
  const xMean = (n - 1) / 2;
  const yMean = series.reduce((sum, y) => sum + y, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (i - xMean) * (series[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }

  return den ? num / den : 0;
}

export function normalizeTo100(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  const clamped = Math.max(min, Math.min(max, value));
  return ((clamped - min) / (max - min)) * 100;
}
