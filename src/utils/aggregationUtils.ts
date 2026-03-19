export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function safeAvg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((sum, x) => sum + x, 0) / nums.length;
}

export function weightedAvg(items: { value: number; weight: number }[]): number {
  const denom = items.reduce((sum, item) => sum + item.weight, 0);
  if (!denom) return 0;
  const numerator = items.reduce((sum, item) => sum + item.value * item.weight, 0);
  return numerator / denom;
}

export function groupBy<T, K extends string | number>(arr: T[], keyFn: (item: T) => K): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}
