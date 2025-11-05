// resource-system-with-logging.ts - Resource system with detailed NPC thinking logs

/**
 * Available resource types in the world
 */
export type ResourceType =
  | "wood"
  | "stone"
  | "iron"
  | "food"
  | "cloth"
  | "tools"
  | "weapons"
  | "medicine";

/**
 * Resource metadata - names, emojis, descriptions
 */
export const RESOURCE_INFO: Record<
  ResourceType,
  {
    name: string;
    emoji: string;
    description: string;
    category: "raw" | "processed" | "crafted";
  }
> = {
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
export const PRODUCTION_RECIPES: Record<
  string,
  {
    produces: ResourceType;
    amount: number;
    timeHours: number;
    requires?: { resource: ResourceType; amount: number }[];
  }
> = {
  // Raw resource gathering
  lumberjack: { produces: "wood", amount: 5, timeHours: 2 },
  miner: { produces: "stone", amount: 3, timeHours: 3 },
  blacksmith: { produces: "iron", amount: 2, timeHours: 4 },
  farmer: { produces: "food", amount: 8, timeHours: 4 },

  // Processed goods - Food production
  baker: {
    produces: "food",
    amount: 10,
    timeHours: 3,
    requires: [{ resource: "food", amount: 2 }], // Uses raw food to make more (baking)
  },

  // Processed goods - Cloth
  tailor: {
    produces: "cloth",
    amount: 2,
    timeHours: 2,
    requires: [{ resource: "food", amount: 1 }],
  },

  // Crafted items - Medicine
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

  // Crafted items - Tools and Weapons
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
export class ResourceStorage {
  public inventory: Map<ResourceType, number> = new Map();

  constructor(
    public id: string,
    public name: string,
    public emoji: string,
    public capacity: number,
    public x: number,
    public y: number
  ) {}

  add(resource: ResourceType, amount: number): number {
    const current = this.inventory.get(resource) || 0;
    const total = this.getTotalStored();
    const available = this.capacity - total;

    if (available <= 0) return 0;

    const canAdd = Math.min(amount, available);
    this.inventory.set(resource, current + canAdd);
    return canAdd;
  }

  remove(resource: ResourceType, amount: number): number {
    const current = this.inventory.get(resource) || 0;
    const canRemove = Math.min(amount, current);

    if (canRemove > 0) {
      this.inventory.set(resource, current - canRemove);
    }

    return canRemove;
  }

  has(resource: ResourceType, amount: number): boolean {
    return (this.inventory.get(resource) || 0) >= amount;
  }

  get(resource: ResourceType): number {
    return this.inventory.get(resource) || 0;
  }

  getTotalStored(): number {
    return Array.from(this.inventory.values()).reduce((a, b) => a + b, 0);
  }

  isFull(): boolean {
    return this.getTotalStored() >= this.capacity;
  }

  getFillPercent(): number {
    return (this.getTotalStored() / this.capacity) * 100;
  }
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
export class ResourceManager {
  private storages: Map<string, ResourceStorage> = new Map();
  private productionTasks: ProductionTask[] = [];

  createStorage(
    id: string,
    name: string,
    emoji: string,
    capacity: number,
    x: number,
    y: number
  ): ResourceStorage {
    const storage = new ResourceStorage(id, name, emoji, capacity, x, y);
    this.storages.set(id, storage);
    return storage;
  }

  getStorage(id: string): ResourceStorage | undefined {
    return this.storages.get(id);
  }

  getAllStorages(): ResourceStorage[] {
    return Array.from(this.storages.values());
  }

  /**
   * ENHANCED: Start production with detailed logging
   */
  startProduction(
    npcName: string,
    occupation: string,
    currentHour: number,
    storageId?: string
  ): ProductionTask | null {
    const occupationLower = occupation?.toLowerCase();

    console.log(`\n💭 ${npcName} (${occupation}) is thinking...`);

    // Check if has recipe
    const recipe = PRODUCTION_RECIPES[occupationLower];
    if (!recipe) {
      console.log(`   ❌ No recipe for occupation "${occupation}"`);
      console.log(
        `   Available occupations:`,
        Object.keys(PRODUCTION_RECIPES).join(", ")
      );
      return null;
    }

    console.log(
      `   📋 Recipe: Can make ${recipe.amount}x ${recipe.produces} in ${recipe.timeHours}h`
    );

    // Check if already working
    const existing = this.productionTasks.find(
      (t) => t.npcName === npcName && !t.completed
    );
    if (existing) {
      const timeLeft = existing.endHour - currentHour;
      console.log(
        `   ⏳ Already working! Making ${existing.amount}x ${existing.resource} (${timeLeft}h left)`
      );
      return existing;
    }

    // Check for required materials
    if (recipe.requires && recipe.requires.length > 0) {
      console.log(`   🔍 Checking materials needed:`);

      if (!storageId) {
        console.log(`   ❌ No storage specified! Cannot check materials.`);
        return null;
      }

      const storage = this.getStorage(storageId);
      if (!storage) {
        console.log(`   ❌ Storage "${storageId}" not found!`);
        return null;
      }

      console.log(`   📦 Checking in ${storage.name}:`);

      let hasAllMaterials = true;
      for (const req of recipe.requires) {
        const available = storage.get(req.resource);
        const has = available >= req.amount;
        const status = has ? "✅" : "❌";
        console.log(
          `      ${status} ${req.resource}: need ${req.amount}, have ${available}`
        );
        if (!has) hasAllMaterials = false;
      }

      if (!hasAllMaterials) {
        console.log(`   ⛔ Cannot start: Missing materials!`);
        return null;
      }

      // Consume materials
      console.log(`   🔧 Consuming materials:`);
      for (const req of recipe.requires) {
        const removed = storage.remove(req.resource, req.amount);
        console.log(`      - Used ${removed}x ${req.resource}`);
      }
    } else {
      console.log(`   ✨ No materials needed - gathering from nature!`);
    }

    // Check storage capacity
    if (storageId) {
      const storage = this.getStorage(storageId);
      if (storage) {
        const spaceAvailable = storage.capacity - storage.getTotalStored();
        if (spaceAvailable < recipe.amount) {
          console.log(
            `   ⚠️  Storage almost full! Only ${spaceAvailable} space left.`
          );
        }
      }
    }

    // Create task
    const task: ProductionTask = {
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
    console.log(
      `   ✅ Started! Will complete at hour ${task.endHour} (in ${recipe.timeHours}h)`
    );

    return task;
  }

  /**
   * ENHANCED: Update production with detailed logging
   */
  updateProduction(currentHour: number): ProductionTask[] {
    const completed: ProductionTask[] = [];

    console.log(`\n⏰ Hour ${currentHour} - Checking production tasks...`);

    const activeTasks = this.productionTasks.filter((t) => !t.completed);
    console.log(`   📊 ${activeTasks.length} NPCs currently working`);

    if (activeTasks.length === 0) {
      console.log(`   😴 No one is working right now`);
    }

    for (const task of this.productionTasks) {
      if (task.completed) continue;

      const timeLeft = task.endHour - currentHour;

      if (currentHour >= task.endHour) {
        // Task finished!
        task.completed = true;
        console.log(`\n   🎉 ${task.npcName} completed work!`);
        console.log(
          `      Made: ${task.amount}x ${task.resource} ${
            RESOURCE_INFO[task.resource].emoji
          }`
        );

        // Add resources to storage
        if (task.storageId) {
          const storage = this.getStorage(task.storageId);
          if (storage) {
            const added = storage.add(task.resource, task.amount);
            if (added < task.amount) {
              console.log(
                `      ⚠️  Storage full! Only added ${added}/${
                  task.amount
                } (lost ${task.amount - added})`
              );
            } else {
              console.log(`      ✅ Added to ${storage.name}`);
              console.log(
                `      📦 ${storage.name} now has ${storage.get(
                  task.resource
                )}x ${task.resource}`
              );
            }
          } else {
            console.log(
              `      ❌ Storage "${task.storageId}" not found! Resources lost!`
            );
          }
        } else {
          console.log(
            `      ⚠️  No storage specified - resources vanished into the void`
          );
        }

        completed.push(task);
      } else {
        // Still working
        console.log(
          `   ⏳ ${task.npcName}: Making ${task.resource} (${timeLeft}h left)`
        );
      }
    }

    // Clean up old completed tasks (keep last 10)
    this.productionTasks = this.productionTasks
      .filter((t) => !t.completed)
      .concat(completed.slice(-10));

    return completed;
  }

  /**
   * ENHANCED: Log storage state
   */
  logStorageState(): void {
    console.log(`\n📦 === STORAGE STATUS ===`);
    for (const storage of this.storages.values()) {
      console.log(`\n${storage.emoji} ${storage.name}:`);
      console.log(
        `   Capacity: ${storage.getTotalStored()}/${storage.capacity} (${storage
          .getFillPercent()
          .toFixed(1)}% full)`
      );

      if (storage.inventory.size === 0) {
        console.log(`   (Empty)`);
      } else {
        console.log(`   Contents:`);
        for (const [resource, amount] of storage.inventory.entries()) {
          const info = RESOURCE_INFO[resource];
          console.log(`      ${info.emoji} ${amount}x ${info.name}`);
        }
      }
    }
  }

  /**
   * ENHANCED: Log what all NPCs are thinking
   */
  logNPCThoughts(npcs: any[], currentHour: number): void {
    console.log(`\n🧠 === NPC THOUGHTS (Hour ${currentHour}) ===`);

    for (const npc of npcs) {
      const task = this.getNPCTask(npc.name);
      const recipe = PRODUCTION_RECIPES[npc.occupation?.toLowerCase()];

      console.log(`\n${npc.name} (${npc.occupation}):`);

      if (!recipe) {
        console.log(
          `   💭 "I don't know how to work... no recipe for my occupation"`
        );
        continue;
      }

      if (task) {
        const timeLeft = task.endHour - currentHour;
        console.log(
          `   💼 "I'm working on ${task.amount}x ${task.resource}... ${timeLeft}h to go!"`
        );
      } else {
        console.log(
          `   😴 "I'm idle. I could make ${recipe.produces} if I had materials..."`
        );

        if (recipe.requires) {
          const storage = this.getStorage("warehouse");
          if (storage) {
            console.log(`   🔍 "Let me check the warehouse..."`);
            let canWork = true;
            for (const req of recipe.requires) {
              const has = storage.get(req.resource);
              if (has >= req.amount) {
                console.log(
                  `      ✅ ${req.resource}: need ${req.amount}, have ${has}`
                );
              } else {
                console.log(
                  `      ❌ ${req.resource}: need ${req.amount}, only have ${has}`
                );
                canWork = false;
              }
            }
            if (canWork) {
              console.log(`   ✨ "I have everything I need! Ready to work!"`);
            } else {
              console.log(`   😞 "Missing materials... can't work yet."`);
            }
          }
        } else {
          console.log(`   ⛏️  "I gather from nature - no materials needed!"`);
        }
      }
    }
  }

  getActiveTasks(): ProductionTask[] {
    return this.productionTasks.filter((t) => !t.completed);
  }

  getNPCTask(npcName: string): ProductionTask | undefined {
    return this.productionTasks.find(
      (t) => t.npcName === npcName && !t.completed
    );
  }

  getTotalResource(resource: ResourceType): number {
    let total = 0;
    for (const storage of this.storages.values()) {
      total += storage.get(resource);
    }
    return total;
  }

  getSummary(): Array<{
    resource: ResourceType;
    name: string;
    emoji: string;
    total: number;
    category: string;
  }> {
    const summary: Array<{
      resource: ResourceType;
      name: string;
      emoji: string;
      total: number;
      category: string;
    }> = [];

    for (const [resourceType, info] of Object.entries(RESOURCE_INFO)) {
      const total = this.getTotalResource(resourceType as ResourceType);
      if (total > 0) {
        summary.push({
          resource: resourceType as ResourceType,
          name: info.name,
          emoji: info.emoji,
          total,
          category: info.category,
        });
      }
    }

    summary.sort((a, b) => {
      if (a.category !== b.category) {
        const order = { raw: 0, processed: 1, crafted: 2 };
        return (
          order[a.category as keyof typeof order] -
          order[b.category as keyof typeof order]
        );
      }
      return a.name.localeCompare(b.name);
    });

    return summary;
  }

  transfer(
    fromId: string,
    toId: string,
    resource: ResourceType,
    amount: number
  ): boolean {
    const from = this.getStorage(fromId);
    const to = this.getStorage(toId);

    if (!from || !to) return false;

    const removed = from.remove(resource, amount);
    if (removed === 0) return false;

    const added = to.add(resource, removed);

    if (added < removed) {
      from.add(resource, removed - added);
    }

    return added > 0;
  }
}
