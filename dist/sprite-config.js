"use strict";
// sprite-config.ts - Configure your sprite sheet layout here
Object.defineProperty(exports, "__esModule", { value: true });
exports.SINGLE_ROW_CONFIG = exports.LARGE_SPRITE_CONFIG = exports.TALL_SHEET_CONFIG = exports.LARGE_SHEET_CONFIG = exports.NPC_SPRITES = exports.OCCUPATION_SPRITES = exports.SPRITE_CONFIG = void 0;
exports.getFrameNumber = getFrameNumber;
exports.getNPCSpriteFrame = getNPCSpriteFrame;
exports.getRowColFromFrame = getRowColFromFrame;
exports.printSpriteLayout = printSpriteLayout;
// ============================================================================
// SPRITE SHEET CONFIGURATION
// ============================================================================
/**
 * Configure your sprite sheet dimensions and layout
 */
exports.SPRITE_CONFIG = {
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
exports.OCCUPATION_SPRITES = {
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
exports.NPC_SPRITES = {
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
function getFrameNumber(row, col) {
    return row * exports.SPRITE_CONFIG.columns + col;
}
/**
 * Get frame number for an NPC's occupation
 */
function getNPCSpriteFrame(occupation) {
    const normalizedOccupation = occupation?.toLowerCase() || "villager";
    const sprite = exports.NPC_SPRITES[normalizedOccupation] || exports.NPC_SPRITES["villager"];
    return getFrameNumber(sprite.row, sprite.col);
}
/**
 * Reverse lookup: Get row/col from frame number (useful for debugging)
 */
function getRowColFromFrame(frame) {
    return {
        row: Math.floor(frame / exports.SPRITE_CONFIG.columns),
        col: frame % exports.SPRITE_CONFIG.columns,
    };
}
/**
 * Debug: Print sprite sheet layout
 */
function printSpriteLayout() {
    console.log("🎨 Sprite Sheet Layout:");
    console.log(`Size: ${exports.SPRITE_CONFIG.columns}x${exports.SPRITE_CONFIG.rows}`);
    console.log(`Total frames: ${exports.SPRITE_CONFIG.columns * exports.SPRITE_CONFIG.rows}`);
    console.log("");
    // Print grid
    for (let row = 0; row < exports.SPRITE_CONFIG.rows; row++) {
        let rowStr = `Row ${row}: `;
        for (let col = 0; col < exports.SPRITE_CONFIG.columns; col++) {
            const frame = getFrameNumber(row, col);
            rowStr += `[${frame.toString().padStart(2, "0")}] `;
        }
        console.log(rowStr);
    }
    console.log("");
    // Print occupations
    console.log("Occupation mapping:");
    Object.entries(exports.NPC_SPRITES).forEach(([occupation, pos]) => {
        const frame = getFrameNumber(pos.row, pos.col);
        console.log(`  ${occupation.padEnd(15)} → Row ${pos.row}, Col ${pos.col} = Frame ${frame}`);
    });
}
// ============================================================================
// ALTERNATIVE CONFIGURATIONS (Examples)
// ============================================================================
/**
 * Example 1: 10x10 sprite sheet
 */
exports.LARGE_SHEET_CONFIG = {
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
exports.TALL_SHEET_CONFIG = {
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
exports.LARGE_SPRITE_CONFIG = {
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
exports.SINGLE_ROW_CONFIG = {
    fileName: "single-row-sprites.png",
    spriteWidth: 16,
    spriteHeight: 16,
    columns: 12,
    rows: 1,
    displayScale: 3,
};
//# sourceMappingURL=sprite-config.js.map