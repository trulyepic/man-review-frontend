export type VoteCounts = Record<string, number>;

function hashString(input: string): number {
  // simple stable 32-bit hash;
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDisplayVoteCounts(
  base: VoteCounts | undefined,
  seriesId: number
): Record<string, number> {
  const src = base ?? {};
  const out: VoteCounts = { ...src };

  for (const [label, actual] of Object.entries(src)) {
    if (typeof actual === "number" && actual < 10) {
      const seed = hashString(`${seriesId}:${label}`);
      const rnd = mulberry32(seed)();
      const bump = 50 + Math.floor(rnd * 100); // 50 to 149
      out[label] = actual + bump;
    }
  }

  return out;
}
