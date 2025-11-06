/**
 * Available resource types in the world
 */
export type ResourceType = "wood" | "stone" | "iron" | "food" | "cloth" | "tools" | "weapons" | "medicine";
/**
 * Resource metadata - names, emojis, descriptions
 */
export declare const RESOURCE_INFO: Record<ResourceType, {
    name: string;
    emoji: string;
    description: string;
    category: "raw" | "processed" | "crafted";
}>;
/**
 * Production recipes - what NPCs can produce
 */
export declare const PRODUCTION_RECIPES: Record<string, {
    produces: ResourceType;
    amount: number;
    timeHours: number;
    requires?: {
        resource: ResourceType;
        amount: number;
    }[];
}>;
/**
 * Storage location for resources
 */
export declare class ResourceStorage {
    id: string;
    name: string;
    emoji: string;
    capacity: number;
    x: number;
    y: number;
    inventory: Map<ResourceType, number>;
    constructor(id: string, name: string, emoji: string, capacity: number, x: number, y: number);
    /**
     * Add resources to storage
     * @returns Amount actually added (may be less than requested if full)
     */
    add(resource: ResourceType, amount: number): number;
    /**
     * Remove resources from storage
     * @returns Amount actually removed (may be less than requested if not enough)
     */
    remove(resource: ResourceType, amount: number): number;
    /**
     * Check if storage has enough of a resource
     */
    has(resource: ResourceType, amount: number): boolean;
    /**
     * Get amount of a specific resource
     */
    get(resource: ResourceType): number;
    /**
     * Get total amount of all resources stored
     */
    getTotalStored(): number;
    /**
     * Check if storage is full
     */
    isFull(): boolean;
    /**
     * Get percentage full
     */
    getFillPercent(): number;
}
/**
 * NPC production task
 */
export interface ProductionTask {
    npcName: string;
    occupation: string;
    resource: ResourceType;
    amount: number;
    startHour: number;
    endHour: number;
    completed: boolean;
    storageId?: string;
}
/**
 * Main resource manager - handles all resources in the world
 */
export declare class ResourceManager {
    private storages;
    private productionTasks;
    /**
     * Create a new storage location
     */
    createStorage(id: string, name: string, emoji: string, capacity: number, x: number, y: number): ResourceStorage;
    /**
     * Get a storage by ID
     */
    getStorage(id: string): ResourceStorage | undefined;
    /**
     * Get all storages
     */
    getAllStorages(): ResourceStorage[];
    /**
     * Start a production task for an NPC
     */
    startProduction(npcName: string, occupation: string, currentHour: number, storageId?: string): ProductionTask | null;
    /**
     * Update production - call every game hour
     */
    updateProduction(currentHour: number): ProductionTask[];
    /**
     * Get active tasks
     */
    getActiveTasks(): ProductionTask[];
    /**
     * Get NPC's current task
     */
    getNPCTask(npcName: string): ProductionTask | undefined;
    /**
     * Get total amount of a resource across all storages
     */
    getTotalResource(resource: ResourceType): number;
    /**
     * Get summary of all resources
     */
    getSummary(): Array<{
        resource: ResourceType;
        name: string;
        emoji: string;
        total: number;
        category: string;
    }>;
    /**
     * Transfer resources between storages
     */
    transfer(fromId: string, toId: string, resource: ResourceType, amount: number): boolean;
}
//# sourceMappingURL=resource-system.d.ts.map