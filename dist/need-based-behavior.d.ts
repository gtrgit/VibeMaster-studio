export type ActivityType = "working" | "eating" | "socializing" | "resting" | "fleeing" | "idle";
export type LocationType = "home" | "workplace" | "tavern" | "market" | "temple" | "town-entrance";
export interface Location {
    id: string;
    name: string;
    type: LocationType;
    x: number;
    y: number;
    capacity?: number;
    residents?: string[];
    ambience?: string;
    description?: string;
}
export interface NPCBehaviorState {
    name: string;
    occupation: string;
    needFood: number;
    needSafety: number;
    needWealth: number;
    needSocial: number;
    needRest: number;
    currentLocation: string;
    currentActivity: ActivityType;
    home: string;
    workplace: string;
}
export interface NPCDecision {
    location: string;
    activity: ActivityType;
    reason: string;
    priority: number;
}
/**
 * Need-based behavior system with security override
 */
export declare class NeedBasedBehavior {
    /**
     * Main decision function - determines what NPC should do
     */
    decideAction(npc: NPCBehaviorState, currentHour: number): NPCDecision;
    /**
     * Decay needs between checkpoints
     */
    decayNeeds(npc: NPCBehaviorState, hours: number): void;
    /**
     * Recover needs based on current activity
     */
    recoverNeeds(npc: NPCBehaviorState, activity: ActivityType): void;
    /**
     * Get activity emoji for display
     */
    getActivityEmoji(activity: ActivityType): string;
    /**
     * Get activity description for narration
     */
    getActivityDescription(npc: NPCBehaviorState, location: Location): string;
}
//# sourceMappingURL=need-based-behavior.d.ts.map