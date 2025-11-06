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
    add(resource: ResourceType, amount: number): number;
    remove(resource: ResourceType, amount: number): number;
    has(resource: ResourceType, amount: number): boolean;
    get(resource: ResourceType): number;
    getTotalStored(): number;
    isFull(): boolean;
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
    createStorage(id: string, name: string, emoji: string, capacity: number, x: number, y: number): ResourceStorage;
    getStorage(id: string): ResourceStorage | undefined;
    getAllStorages(): ResourceStorage[];
    /**
     * ENHANCED: Start production with detailed logging
     */
    startProduction(npcName: string, occupation: string, currentHour: number, storageId?: string): ProductionTask | null;
    /**
     * ENHANCED: Update production with detailed logging
     */
    updateProduction(currentHour: number): ProductionTask[];
    /**
     * ENHANCED: Log storage state
     */
    logStorageState(): void;
    /**
     * ENHANCED: Log what all NPCs are thinking
     */
    logNPCThoughts(npcs: any[], currentHour: number): void;
    getActiveTasks(): ProductionTask[];
    getNPCTask(npcName: string): ProductionTask | undefined;
    getTotalResource(resource: ResourceType): number;
    getSummary(): Array<{
        resource: ResourceType;
        name: string;
        emoji: string;
        total: number;
        category: string;
    }>;
    transfer(fromId: string, toId: string, resource: ResourceType, amount: number): boolean;
}
//# sourceMappingURL=resource-system-with-logging.d.ts.map