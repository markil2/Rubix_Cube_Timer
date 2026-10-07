const FACES = ['R', 'L', 'U', 'D', 'F', 'B'] as const
const MODIFIERS = ['', "'", '2'] as const
/** Faces on the same axis commute, so R L R is effectively redundant. */
const AXIS: Record<(typeof FACES)[number], number> = { R: 0, L: 0, U: 1, D: 1, F: 2, B: 2 }

/** Random-move 3x3 scramble with no repeated face and no same-axis triples. */
export function generateScramble(length = 20, random: () => number = Math.random): string {
  const moves: (typeof FACES)[number][] = []
  while (moves.length < length) {
    const face = FACES[Math.floor(random() * FACES.length)]
    const prev = moves[moves.length - 1]
    const prev2 = moves[moves.length - 2]
    if (face === prev) continue
    if (prev && prev2 && AXIS[face] === AXIS[prev] && AXIS[face] === AXIS[prev2]) continue
    moves.push(face)
  }
  return moves.map((f) => f + MODIFIERS[Math.floor(random() * MODIFIERS.length)]).join(' ')
}

/** Small deterministic PRNG (mulberry32) for stable mock data. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
