/** @jest-environment node */
import { generatePuzzle, createSeededRng } from './index.js';

// AC-4 Jest timing proxy (D004). Real-browser measurement is deferred to SCRUM-7 (FU-2).
// Seeded runs only, so the work is deterministic; an untimed warm-up removes JIT/cold-start noise.
const PER_RUN_LIMIT_MS = 2000;

describe('AC-4: 9x9 Hard generation time', () => {
  test('each seeded run completes within 2000 ms', () => {
    generatePuzzle(9, 'hard', { rng: createSeededRng(999) }); // warm-up, untimed

    for (let seed = 1; seed <= 10; seed += 1) {
      const start = performance.now();
      const res = generatePuzzle(9, 'hard', { rng: createSeededRng(seed) });
      const elapsed = performance.now() - start;
      expect(res.puzzle.flat().filter((v) => v !== 0)).toHaveLength(25);
      expect(elapsed).toBeLessThan(PER_RUN_LIMIT_MS);
    }
  }, 120000);
});
