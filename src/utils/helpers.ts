export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

export function weightedRandom<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [key, weight] of entries) {
    r -= weight;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

export function normalizePosition(x: number, y: number): { x: number; y: number } {
  return {
    x: clamp(x, -1, 1),
    y: clamp(y, -1, 1),
  };
}

export function computeAdvantageFromPosition(position: { x: number; y: number }): number {
  const distance = Math.sqrt(position.x * position.x + position.y * position.y);
  return clamp(1 - distance, -1, 1);
}
