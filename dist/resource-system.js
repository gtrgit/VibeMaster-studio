"use strict";
// resource-system.ts - Core resource management and production system
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceManager = exports.ResourceStorage = exports.PRODUCTION_RECIPES = exports.RESOURCE_INFO = void 0;
/**
 * Resource metadata - names, emojis, descriptions
 */
exports.RESOURCE_INFO = {
    wood: {
        name: "Wood",
        emoji: "🪵",
        description: "Basic building material",
        category: "raw",
    },
    stone: {
        name: "Stone",
        emoji: "🪨",
        description: "Sturdy construction material",
        category: "raw",
    },
    iron: {
        name: "Iron",
        emoji: "⚙️",
        description: "Metal ore for tools and weapons",
        category: "raw",
    },
    food: {
        name: "Food",
        emoji: "🍎",
        description: "Sustenance for NPCs",
        category: "processed",
    },
    cloth: {
        name: "Cloth",
        emoji: "🧵",
        description: "Fabric for clothing",
        category: "processed",
    },
    tools: {
        name: "Tools",
        emoji: "🔨",
        description: "Equipment for work",
        category: "crafted",
    },
    weapons: {
        name: "Weapons",
        emoji: "⚔️",
        description: "Arms for defense",
        category: "crafted",
    },
    medicine: {
        name: "Medicine",
        emoji: "💊",
        description: "Healing supplies",
        category: "crafted",
    },
};
/**
 * Production recipes - what NPCs can produce
 */
exports.PRODUCTION_RECIPES = {
    // Raw resource gathering
    lumberjack: { produces: "wood", amount: 5, timeHours: 2 },
    miner: { produces: "stone", amount: 3, timeHours: 3 },
    blacksmith: { produces: "iron", amount: 2, timeHours: 4 },
    farmer: { produces: "food", amount: 8, timeHours: 4 },
    // Food production
    baker: {
        produces: "food",
        amount: 10,
        timeHours: 3,
        requires: [{ resource: "food", amount: 2 }], // Uses raw food to make more (baking)
    },
    // Processed goods
    tailor: {
        produces: "cloth",
        amount: 2,
        timeHours: 2,
        requires: [{ resource: "food", amount: 1 }], // Needs raw materials
    },
    // Medicine production
    healer: {
        produces: "medicine",
        amount: 2,
        timeHours: 2,
        requires: [{ resource: "food", amount: 2 }],
    },
    herbalist: {
        produces: "medicine",
        amount: 3,
        timeHours: 2,
        requires: [{ resource: "food", amount: 1 }], // Uses herbs (food) to make medicine
    },
    // Crafted items
    carpenter: {
        produces: "tools",
        amount: 1,
        timeHours: 3,
        requires: [
            { resource: "wood", amount: 2 },
            { resource: "iron", amount: 1 },
        ],
    },
    weaponsmith: {
        produces: "weapons",
        amount: 1,
        timeHours: 4,
        requires: [
            { resource: "iron", amount: 3 },
            { resource: "wood", amount: 1 },
        ],
    },
};
/**
 * Storage location for resources
 */
class ResourceStorage {
    id;
    name;
    emoji;
    capacity;
    x;
    y;
    inventory = new Map();
    constructor(id, name, emoji, capacity, x, y) {
        this.id = id;
        this.name = name;
        this.emoji = emoji;
        this.capacity = capacity;
        this.x = x;
        this.y = y;
    }
    /**
     * Add resources to storage
     * @returns Amount actually added (may be less than requested if full)
     */
    add(resource, amount) {
        const current = this.inventory.get(resource) || 0;
        const total = this.getTotalStored();
        const available = this.capacity - total;
        if (available <= 0)
            return 0;
        const canAdd = Math.min(amount, available);
        this.inventory.set(resource, current + canAdd);
        return canAdd;
    }
    /**
     * Remove resources from storage
     * @returns Amount actually removed (may be less than requested if not enough)
     */
    remove(resource, amount) {
        const current = this.inventory.get(resource) || 0;
        const canRemove = Math.min(amount, current);
        if (canRemove > 0) {
            this.inventory.set(resource, current - canRemove);
        }
        return canRemove;
    }
    /**
     * Check if storage has enough of a resource
     */
    has(resource, amount) {
        return (this.inventory.get(resource) || 0) >= amount;
    }
    /**
     * Get amount of a specific resource
     */
    get(resource) {
        return this.inventory.get(resource) || 0;
    }
    /**
     * Get total amount of all resources stored
     */
    getTotalStored() {
        return Array.from(this.inventory.values()).reduce((a, b) => a + b, 0);
    }
    /**
     * Check if storage is full
     */
    isFull() {
        return this.getTotalStored() >= this.capacity;
    }
    /**
     * Get percentage full
     */
    getFillPercent() {
        return (this.getTotalStored() / this.capacity) * 100;
    }
}
exports.ResourceStorage = ResourceStorage;
/**
 * Main resource manager - handles all resources in the world
 */
class ResourceManager {
    storages = new Map();
    productionTasks = [];
    /**
     * Create a new storage location
     */
    createStorage(id, name, emoji, capacity, x, y) {
        const storage = new ResourceStorage(id, name, emoji, capacity, x, y);
        this.storages.set(id, storage);
        return storage;
    }
    /**
     * Get a storage by ID
     */
    getStorage(id) {
        return this.storages.get(id);
    }
    /**
     * Get all storages
     */
    getAllStorages() {
        return Array.from(this.storages.values());
    }
    /**
     * Start a production task for an NPC
     */
    startProduction(npcName, occupation, currentHour, storageId) {
        const recipe = exports.PRODUCTION_RECIPES[occupation.toLowerCase()];
        if (!recipe)
            return null;
        // Check if NPC already has an active task
        const existing = this.productionTasks.find((t) => t.npcName === npcName && !t.completed);
        if (existing)
            return existing;
        // Check if storage has required materials
        if (recipe.requires && storageId) {
            const storage = this.getStorage(storageId);
            if (!storage)
                return null;
            for (const req of recipe.requires) {
                if (!storage.has(req.resource, req.amount)) {
                    console.log(`${npcName} cannot produce: missing ${req.amount} ${req.resource}`);
                    return null;
                }
            }
            // Consume materials
            for (const req of recipe.requires) {
                storage.remove(req.resource, req.amount);
            }
        }
        const task = {
            npcName,
            occupation,
            resource: recipe.produces,
            amount: recipe.amount,
            startHour: currentHour,
            endHour: currentHour + recipe.timeHours,
            completed: false,
            storageId,
        };
        this.productionTasks.push(task);
        return task;
    }
    /**
     * Update production - call every game hour
     */
    updateProduction(currentHour) {
        const completed = [];
        for (const task of this.productionTasks) {
            if (task.completed)
                continue;
            if (currentHour >= task.endHour) {
                // Task finished!
                task.completed = true;
                // Add resources to storage
                if (task.storageId) {
                    const storage = this.getStorage(task.storageId);
                    if (storage) {
                        const added = storage.add(task.resource, task.amount);
                        if (added < task.amount) {
                            console.log(`Storage full! ${task.npcName} couldn't store all ${task.resource}`);
                        }
                    }
                }
                completed.push(task);
            }
        }
        // Clean up old completed tasks (keep last 10)
        this.productionTasks = this.productionTasks
            .filter((t) => !t.completed)
            .concat(completed.slice(-10));
        return completed;
    }
    /**
     * Get active tasks
     */
    getActiveTasks() {
        return this.productionTasks.filter((t) => !t.completed);
    }
    /**
     * Get NPC's current task
     */
    getNPCTask(npcName) {
        return this.productionTasks.find((t) => t.npcName === npcName && !t.completed);
    }
    /**
     * Get total amount of a resource across all storages
     */
    getTotalResource(resource) {
        let total = 0;
        for (const storage of this.storages.values()) {
            total += storage.get(resource);
        }
        return total;
    }
    /**
     * Get summary of all resources
     */
    getSummary() {
        const summary = [];
        for (const [resourceType, info] of Object.entries(exports.RESOURCE_INFO)) {
            const total = this.getTotalResource(resourceType);
            if (total > 0) {
                summary.push({
                    resource: resourceType,
                    name: info.name,
                    emoji: info.emoji,
                    total,
                    category: info.category,
                });
            }
        }
        // Sort by category then name
        summary.sort((a, b) => {
            if (a.category !== b.category) {
                const order = { raw: 0, processed: 1, crafted: 2 };
                return (order[a.category] -
                    order[b.category]);
            }
            return a.name.localeCompare(b.name);
        });
        return summary;
    }
    /**
     * Transfer resources between storages
     */
    transfer(fromId, toId, resource, amount) {
        const from = this.getStorage(fromId);
        const to = this.getStorage(toId);
        if (!from || !to)
            return false;
        const removed = from.remove(resource, amount);
        if (removed === 0)
            return false;
        const added = to.add(resource, removed);
        // If couldn't add all, put back what couldn't be added
        if (added < removed) {
            from.add(resource, removed - added);
        }
        return added > 0;
    }
}
exports.ResourceManager = ResourceManager;
//# sourceMappingURL=resource-system.js.map