/**
 * Configure your sprite sheet dimensions and layout
 */
export declare const SPRITE_CONFIG: {
    fileName: string;
    spriteWidth: number;
    spriteHeight: number;
    columns: number;
    rows: number;
    displayScale: number;
};
/**
 * Map NPC occupations to sprite positions
 * Format: 'occupation': { row: Y, col: X }
 *
 * Rows and columns start at 0 (top-left is row:0, col:0)
 */
export declare const OCCUPATION_SPRITES: {
    [key: string]: {
        row: number;
        col: number;
    };
};
export declare const NPC_SPRITES: {
    [key: string]: {
        row: number;
        col: number;
    };
};
/**
 * Helper function to convert row/col to frame number
 */
export declare function getFrameNumber(row: number, col: number): number;
/**
 * Get frame number for an NPC's occupation
 */
export declare function getNPCSpriteFrame(occupation: string): number;
/**
 * Reverse lookup: Get row/col from frame number (useful for debugging)
 */
export declare function getRowColFromFrame(frame: number): {
    row: number;
    col: number;
};
/**
 * Debug: Print sprite sheet layout
 */
export declare function printSpriteLayout(): void;
/**
 * Example 1: 10x10 sprite sheet
 */
export declare const LARGE_SHEET_CONFIG: {
    fileName: string;
    spriteWidth: number;
    spriteHeight: number;
    columns: number;
    rows: number;
    displayScale: number;
};
/**
 * Example 2: 4x8 sprite sheet (4 columns, 8 rows)
 */
export declare const TALL_SHEET_CONFIG: {
    fileName: string;
    spriteWidth: number;
    spriteHeight: number;
    columns: number;
    rows: number;
    displayScale: number;
};
/**
 * Example 3: 32x32 sprites (larger pixel art)
 */
export declare const LARGE_SPRITE_CONFIG: {
    fileName: string;
    spriteWidth: number;
    spriteHeight: number;
    columns: number;
    rows: number;
    displayScale: number;
};
/**
 * Example 4: Single row sprite sheet
 */
export declare const SINGLE_ROW_CONFIG: {
    fileName: string;
    spriteWidth: number;
    spriteHeight: number;
    columns: number;
    rows: number;
    displayScale: number;
};
//# sourceMappingURL=sprite-config.d.ts.map