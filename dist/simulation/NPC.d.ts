import { PrismaClient } from '@prisma/client';
export declare class NPCAgent {
    id: string;
    private db_;
    private db;
    constructor(id: string, db_: PrismaClient);
    /**
     * Main AI loop - called every tick
     */
    tick(worldDay: number, worldHour: number): Promise<void>;
    /**
     * Update NPC needs - they decay over time
     */
    private updateNeeds;
    /**
     * Update emotions based on needs and events
     */
    private updateEmotions;
    /**
     * Evaluate and update goals based on needs and personality
     */
    private evaluateGoals;
    /**
     * Take action on highest priority goal
     */
    private takeAction;
    /**
     * Plan an action based on goal and NPC state
     */
    private planAction;
    /**
     * Execute an action
     */
    private executeAction;
    /**
     * Add a memory for this NPC
     */
    private addMemory;
    /**
     * Get NPC's current state
     */
    getState(): Promise<any>;
}
//# sourceMappingURL=NPC.d.ts.map