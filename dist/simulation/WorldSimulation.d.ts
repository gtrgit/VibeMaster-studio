import { PrismaClient } from '@prisma/client';
import { SimulationConfig } from '../types';
export declare class WorldSimulation {
    private db;
    private worldId;
    private npcAgents;
    private running;
    private tickCount;
    private config;
    constructor(db: PrismaClient, worldId: string, config?: Partial<SimulationConfig>);
    /**
     * Initialize the simulation
     */
    initialize(): Promise<void>;
    /**
     * Start the simulation loop
     */
    start(): Promise<void>;
    /**
     * Stop the simulation
     */
    stop(): void;
    /**
     * Single simulation tick
     */
    private tick;
    /**
     * Check for emergent events
     */
    private checkForEvents;
    /**
     * Display current status of all NPCs
     */
    private displayStatus;
    /**
     * Get full world state
     */
    getWorldState(): Promise<any>;
    /**
     * Add a new NPC to the simulation
     */
    addNPC(npcData: any): Promise<string>;
    /**
     * Create an event
     */
    createEvent(eventData: {
        type: string;
        description: string;
        participantIds: string[];
        targetId?: string;
    }): Promise<void>;
    /**
     * Logging utility
     */
    private log;
    /**
     * Sleep utility
     */
    private sleep;
}
//# sourceMappingURL=WorldSimulation.d.ts.map