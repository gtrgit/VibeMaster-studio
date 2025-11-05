// sprite-config.ts - Configure your sprite sheet layout here

// ============================================================================
// SPRITE SHEET CONFIGURATION
// ============================================================================

/**
 * Configure your sprite sheet dimensions and layout
 */
export const SPRITE_CONFIG = {
  // Sprite sheet file
  fileName: "npc-1.png",

  // Individual sprite dimensions (in pixels)
  spriteWidth: 46.33,
  spriteHeight: 46.33,

  // Sheet layout
  columns: 3, // ← How many sprites per row
  rows: 3, // ← How many rows of sprites

  // Display scale (how big sprites appear on screen)
  displayScale: 1, // 16x16 * 3 = 48x48 pixels on screen
};

/**
 * Map NPC occupations to sprite positions
 * Format: 'occupation': { row: Y, col: X }
 *
 * Rows and columns start at 0 (top-left is row:0, col:0)
 */
export const OCCUPATION_SPRITES: {
  [key: string]: { row: number; col: number };
} = {
  // Example layout for an 8x4 sprite sheet:
  // Row 0: Workers
  blacksmith: { row: 0, col: 0 },
  carpenter: { row: 0, col: 1 },
  miner: { row: 0, col: 2 },
  farmer: { row: 0, col: 3 },
  fisher: { row: 0, col: 4 },
  lumberjack: { row: 0, col: 5 },
  mason: { row: 0, col: 6 },
  tanner: { row: 0, col: 7 },

  // Row 1: Merchants & Service
  merchant: { row: 1, col: 0 },
  trader: { row: 1, col: 1 },
  innkeeper: { row: 1, col: 2 },
  cook: { row: 1, col: 3 },
  baker: { row: 1, col: 4 },
  barkeep: { row: 1, col: 5 },
  tailor: { row: 1, col: 6 },
  jeweler: { row: 1, col: 7 },

  // Row 2: Knowledge & Healing
  healer: { row: 2, col: 0 },
  priest: { row: 2, col: 1 },
  scholar: { row: 2, col: 2 },
  mage: { row: 2, col: 3 },
  alchemist: { row: 2, col: 4 },
  scribe: { row: 2, col: 5 },
  teacher: { row: 2, col: 6 },
  librarian: { row: 2, col: 7 },

  // Row 3: Guards & Nobles
  guard: { row: 3, col: 0 },
  soldier: { row: 3, col: 1 },
  knight: { row: 3, col: 2 },
  captain: { row: 3, col: 3 },
  noble: { row: 3, col: 4 },
  lord: { row: 3, col: 5 },
  lady: { row: 3, col: 6 },
  villager: { row: 3, col: 7 }, // Default
};

export const NPC_SPRITES: {
  [key: string]: { row: number; col: number };
} = {
  // Example layout for an 8x4 sprite sheet:
  // Row 0: Workers
  blacksmith: { row: 0, col: 0 },
  merchant: { row: 0, col: 1 },
  guard: { row: 0, col: 2 },
  farmer: { row: 1, col: 0 },
  healer: { row: 1, col: 1 },
  cook: { row: 1, col: 2 },
  baker: { row: 2, col: 0 },
  scholar: { row: 2, col: 1 },
  villager: { row: 2, col: 2 },
};

/**
 * Helper function to convert row/col to frame number
 */
export function getFrameNumber(row: number, col: number): number {
  return row * SPRITE_CONFIG.columns + col;
}

/**
 * Get frame number for an NPC's occupation
 */
export function getNPCSpriteFrame(occupation: string): number {
  const normalizedOccupation = occupation?.toLowerCase() || "villager";
  const sprite = NPC_SPRITES[normalizedOccupation] || NPC_SPRITES["villager"];
  return getFrameNumber(sprite.row, sprite.col);
}

/**
 * Reverse lookup: Get row/col from frame number (useful for debugging)
 */
export function getRowColFromFrame(frame: number): {
  row: number;
  col: number;
} {
  return {
    row: Math.floor(frame / SPRITE_CONFIG.columns),
    col: frame % SPRITE_CONFIG.columns,
  };
}

/**
 * Debug: Print sprite sheet layout
 */
export function printSpriteLayout(): void {
  console.log("🎨 Sprite Sheet Layout:");
  console.log(`Size: ${SPRITE_CONFIG.columns}x${SPRITE_CONFIG.rows}`);
  console.log(`Total frames: ${SPRITE_CONFIG.columns * SPRITE_CONFIG.rows}`);
  console.log("");

  // Print grid
  for (let row = 0; row < SPRITE_CONFIG.rows; row++) {
    let rowStr = `Row ${row}: `;
    for (let col = 0; col < SPRITE_CONFIG.columns; col++) {
      const frame = getFrameNumber(row, col);
      rowStr += `[${frame.toString().padStart(2, "0")}] `;
    }
    console.log(rowStr);
  }
  console.log("");

  // Print occupations
  console.log("Occupation mapping:");
  Object.entries(NPC_SPRITES).forEach(([occupation, pos]) => {
    const frame = getFrameNumber(pos.row, pos.col);
    console.log(
      `  ${occupation.padEnd(15)} → Row ${pos.row}, Col ${
        pos.col
      } = Frame ${frame}`
    );
  });
}

// ============================================================================
// ALTERNATIVE CONFIGURATIONS (Examples)
// ============================================================================

/**
 * Example 1: 10x10 sprite sheet
 */
export const LARGE_SHEET_CONFIG = {
  fileName: "large-sprites.png",
  spriteWidth: 16,
  spriteHeight: 16,
  columns: 10,
  rows: 10,
  displayScale: 3,
};

/**
 * Example 2: 4x8 sprite sheet (4 columns, 8 rows)
 */
export const TALL_SHEET_CONFIG = {
  fileName: "tall-sprites.png",
  spriteWidth: 16,
  spriteHeight: 16,
  columns: 4,
  rows: 8,
  displayScale: 3,
};

/**
 * Example 3: 32x32 sprites (larger pixel art)
 */
export const LARGE_SPRITE_CONFIG = {
  fileName: "large-32x32-sprites.png",
  spriteWidth: 32,
  spriteHeight: 32,
  columns: 5,
  rows: 5,
  displayScale: 2, // 32x32 * 2 = 64x64 on screen
};

/**
 * Example 4: Single row sprite sheet
 */
export const SINGLE_ROW_CONFIG = {
  fileName: "single-row-sprites.png",
  spriteWidth: 16,
  spriteHeight: 16,
  columns: 12,
  rows: 1,
  displayScale: 3,
};
