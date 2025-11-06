import { NPCBehaviorState } from "./need-based-behavior";
import { LocationSystem } from "./location-system";
/**
 * Daily cycle with 4 checkpoints: Dawn, Midday, Evening, Night
 */
export declare class DailyCycleSystem {
    private behaviorSystem;
    private locationSystem;
    private npcs;
    private lastCheckpointHour;
    readonly CHECKPOINTS: number[];
    readonly CHECKPOINT_NAMES: Record<number, string>;
    constructor(locationSystem: LocationSystem);
    /**
     * Register an NPC in the system
     */
    registerNPC(npc: NPCBehaviorState): void;
    /**
     * Get NPC by name
     */
    getNPC(name: string): NPCBehaviorState | undefined;
    /**
     * Get all NPCs
     */
    getAllNPCs(): NPCBehaviorState[];
    /**
     * Get NPCs at a specific location
     */
    getNPCsAtLocation(locationId: string): NPCBehaviorState[];
    /**
     * Main update - called every hour
     */
    onHourChange(newHour: number): void;
    /**
     * Run a checkpoint - evaluate all NPCs
     */
    private runCheckpoint;
    /**
     * Log which NPCs are at each location
     */
    private logLocationOccupancy;
    /**
     * Get emoji for location type
     */
    private getLocationEmoji;
    /**
     * Update NPC needs based on their activity (called continuously)
     */
    updateNPCNeeds(): void;
    /**
     * Manually trigger security threat (for testing)
     */
    triggerSecurityThreat(severity: "minor" | "major" | "critical"): void;
    /**
     * Restore security after threat resolved
     */
    restoreSecurity(amount?: number): void;
    /**
     * Get next checkpoint info
     */
    getNextCheckpoint(currentHour: number): {
        hour: number;
        name: string;
        hoursUntil: number;
    };
    /**
     * Get summary for UI display
     */
    getSummary(currentHour: number): string;
}
//# sourceMappingURL=daily-cycle-system.d.ts.map