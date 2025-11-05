// WorldSimulation.ts - Main simulation engine
import { PrismaClient } from '@prisma/client';
import { NPCAgent } from './NPC';
import { SimulationConfig } from '../types';

export class WorldSimulation {
  private db: PrismaClient;
  private worldId: string;
  private npcAgents: Map<string, NPCAgent> = new Map();
  private running: boolean = false;
  private tickCount: number = 0;
  private config: SimulationConfig;

  constructor(
    db: PrismaClient,
    worldId: string,
    config?: Partial<SimulationConfig>
  ) {
    this.db = db;
    this.worldId = worldId;
    this.config = {
      tickSpeed: config?.tickSpeed || 1000,
      autoSaveInterval: config?.autoSaveInterval || 10,
      enableLogging: config?.enableLogging ?? true,
      logLevel: config?.logLevel || 'info'
    };
  }

  /**
   * Initialize the simulation
   */
  async initialize(): Promise<void> {
    this.log('info', '🌍 Initializing world simulation...');

    // Load all NPCs and create agents
    const npcs = await this.db.nPC.findMany({
      where: { worldId: this.worldId }
    });

    for (const npc of npcs) {
      this.npcAgents.set(npc.id, new NPCAgent(npc.id, this.db));
    }

    this.log('info', `✅ Loaded ${npcs.length} NPCs`);
  }

  /**
   * Start the simulation loop
   */
  async start(): Promise<void> {
    if (this.running) {
      this.log('warn', '⚠️  Simulation already running');
      return;
    }

    this.running = true;
    this.log('info', '▶️  Starting simulation...');

    // Main simulation loop
    while (this.running) {
      await this.tick();
      await this.sleep(this.config.tickSpeed);
    }
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    this.log('info', '⏸️  Stopping simulation...');
    this.running = false;
  }

  /**
   * Single simulation tick
   */
  private async tick(): Promise<void> {
    this.tickCount++;

    // Get current world time
    const world = await this.db.world.findUnique({
      where: { id: this.worldId }
    });

    if (!world) {
      this.log('error', '❌ World not found');
      this.stop();
      return;
    }

    const { currentDay, currentHour } = world;

    // Log time
    this.log('debug', `\n⏰ Day ${currentDay}, Hour ${currentHour}:00`);

    // Run all NPC ticks
    const npcPromises = Array.from(this.npcAgents.values()).map(agent =>
      agent.tick(currentDay, currentHour)
    );
    await Promise.all(npcPromises);

    // Check for emergent events
    await this.checkForEvents(currentDay, currentHour);

    // Advance time (1 tick = 1 hour)
    let newHour = currentHour + 1;
    let newDay = currentDay;

    if (newHour >= 24) {
      newHour = 0;
      newDay++;
      this.log('info', `\n📅 NEW DAY: Day ${newDay}`);
    }

    await this.db.world.update({
      where: { id: this.worldId },
      data: {
        currentDay: newDay,
        currentHour: newHour
      }
    });

    // Auto-save
    if (this.tickCount % this.config.autoSaveInterval === 0) {
      this.log('info', '💾 Auto-saving...');
    }

    // Display NPC status every 6 hours (simulated)
    if (currentHour % 6 === 0) {
      await this.displayStatus();
    }
  }

  /**
   * Check for emergent events
   */
  private async checkForEvents(day: number, hour: number): Promise<void> {
    // Get all NPCs
    const npcs = await this.db.nPC.findMany({
      where: { worldId: this.worldId },
      include: { goals: true }
    });

    // Look for interesting patterns

    // Example: NPC with desperate rescue goal
    for (const npc of npcs) {
      const desperateGoal = npc.goals.find(
        g => g.type === 'rescue' && g.desperate
      );

      if (desperateGoal && !desperateGoal.completed) {
        // Check if time is running out
        if (desperateGoal.deadline && day >= desperateGoal.deadline - 2) {
          this.log('warn', `⚠️  ${npc.name}'s rescue mission is running out of time!`);
          
          // This could trigger a dramatic event
          // For now, just log it
        }
      }
    }

    // Example: Multiple NPCs in same location with low relationships
    // Could trigger conflicts, etc.

    // This is where emergent narrative opportunities are detected!
  }

  /**
   * Display current status of all NPCs
   */
  private async displayStatus(): Promise<void> {
    const npcs = await this.db.nPC.findMany({
      where: { worldId: this.worldId },
      include: { 
        goals: { 
          where: { completed: false, failed: false },
          orderBy: { priority: 'desc' },
          take: 1
        }
      }
    });

    this.log('info', '\n📊 NPC STATUS:');
    for (const npc of npcs) {
      const needs = `F:${npc.needFood} S:${npc.needSafety} W:${npc.needWealth}`;
      const emotion = `😊${npc.emotionHappiness} 😰${npc.emotionFear} 😢${npc.emotionSadness}`;
      const topGoal = npc.goals[0] ? `[${npc.goals[0].type}]` : '[idle]';
      
      this.log('info', `  ${npc.name}: ${needs} | ${emotion} | ${topGoal}`);
    }
  }

  /**
   * Get full world state
   */
  async getWorldState(): Promise<any> {
    const world = await this.db.world.findUnique({
      where: { id: this.worldId },
      include: {
        npcs: {
          include: {
            goals: true,
            memories: { take: 5, orderBy: { day: 'desc' } },
            location: true
          }
        },
        locations: true,
        events: { take: 20, orderBy: { day: 'desc' } },
        factions: true
      }
    });

    return world;
  }

  /**
   * Add a new NPC to the simulation
   */
  async addNPC(npcData: any): Promise<string> {
    const npc = await this.db.nPC.create({
      data: {
        ...npcData,
        worldId: this.worldId
      }
    });

    // Create agent
    this.npcAgents.set(npc.id, new NPCAgent(npc.id, this.db));

    this.log('info', `➕ Added new NPC: ${npc.name}`);
    return npc.id;
  }

  /**
   * Create an event
   */
  async createEvent(eventData: {
    type: string;
    description: string;
    participantIds: string[];
    targetId?: string;
  }): Promise<void> {
    const world = await this.db.world.findUnique({
      where: { id: this.worldId }
    });

    if (!world) return;

    await this.db.event.create({
      data: {
        worldId: this.worldId,
        day: world.currentDay,
        hour: world.currentHour,
        type: eventData.type,
        description: eventData.description,
        locationId: '', // Would need actual location
        targetId: eventData.targetId
      }
    });

    this.log('info', `📰 EVENT: ${eventData.description}`);
  }

  /**
   * Logging utility
   */
  private log(level: string, message: string): void {
    if (!this.config.enableLogging) return;

    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel];
    const messageLevel = levels[level as keyof typeof levels];

    if (messageLevel >= configLevel) {
      console.log(message);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
