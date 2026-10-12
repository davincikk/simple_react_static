const freezeDeep = (obj) => {
  Object.values(obj).forEach((v) => {
    if (v && typeof v === 'object') freezeDeep(v);
  });
  return Object.freeze(obj);
};

export const SIZES = Object.freeze([4, 6, 9]);
export const LEVELS = Object.freeze(['easy', 'medium', 'hard']);
export const LEVEL_LABELS = freezeDeep({ easy: 'Easy', medium: 'Medium', hard: 'Hard' });

// Box dimensions are explicit (never derived with sqrt): 6x6 uses 2 rows x 3 cols.
export const BOX_DIMS = freezeDeep({
  4: { rows: 2, cols: 2 },
  6: { rows: 2, cols: 3 },
  9: { rows: 3, cols: 3 },
});

// Exact number of pre-filled cells per size and level (AC-3).
export const CLUE_COUNTS = freezeDeep({
  4: { easy: 8, medium: 6, hard: 5 },
  6: { easy: 18, medium: 14, hard: 11 },
  9: { easy: 40, medium: 32, hard: 25 },
});

export const GENERATION_LIMITS = freezeDeep({ orderingsPerGrid: 3, maxAttempts: 40 });

export function getSizeConfig(size) {
  if (!SIZES.includes(size)) return null;
  return { size, boxRows: BOX_DIMS[size].rows, boxCols: BOX_DIMS[size].cols };
}
