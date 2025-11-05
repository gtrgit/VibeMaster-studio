// NPC.ts - Individual NPC with AI decision-making
import { PrismaClient } from '@prisma/client';
import { Needs, Emotions, Goal, Action, MemoryEntry } from '../types';
import { safeJsonParse, safeJsonStringify } from '../database';

export class NPCAgent {
  private db: PrismaClient;
  
  constructor(
    public id: string,
    private db_: PrismaClient
  ) {
    this.db = db_;
  }

  /**
   * Main AI loop - called every tick
   */
  async tick(worldDay: number, worldHour: number): Promise<void> {
    // 1. Update needs (they decay over time)
    await this.updateNeeds(worldHour);
    
    // 2. Update emotions (based on needs and recent events)
    await this.updateEmotions();
    
    // 3. Evaluate and update goals
    await this.evaluateGoals();
    
    // 4. Take action on highest priority goal
    await this.takeAction(worldDay, worldHour);
  }

  /**
   * Update NPC needs - they decay over time
   */
  private async updateNeeds(hour: number): Promise<void> {
    const npc = await this.db.nPC.findUnique({ where: { id: this.id } });
    if (!npc) return;

    let updates: any = {};

    // Food decreases every hour
    updates.needFood = Math.max(0, npc.needFood - 2);

    // Safety depends on location danger
    // (simplified - would check actual location)
    
    // Social needs decrease if alone
    updates.needSocial = Math.max(0, npc.needSocial - 1);

    // Wealth doesn't decay naturally
    
    // Purpose decreases if no active goals
    const goals = await this.db.goal.findMany({
      where: { npcId: this.id, completed: false, failed: false }
    });
    if (goals.length === 0) {
      updates.needPurpose = Math.max(0, npc.needPurpose - 1);
    }

    await this.db.nPC.update({
      where: { id: this.id },
      data: updates
    });
  }

  /**
   * Update emotions based on needs and events
   */
  private async updateEmotions(): Promise<void> {
    const npc = await this.db.nPC.findUnique({ where: { id: this.id } });
    if (!npc) return;

    let updates: any = {};

    // Happiness based on overall needs satisfaction
    const avgNeeds = (npc.needFood + npc.needSafety + npc.needWealth + 
                      npc.needSocial + npc.needPurpose) / 5;
    updates.emotionHappiness = Math.floor(avgNeeds);

    // Fear increases when safety is low
    if (npc.needSafety < 30) {
      updates.emotionFear = Math.min(100, npc.emotionFear + 10);
    } else {
      updates.emotionFear = Math.max(0, npc.emotionFear - 5);
    }

    // Sadness increases when social needs low
    if (npc.needSocial < 30) {
      updates.emotionSadness = Math.min(100, npc.emotionSadness + 5);
    } else {
      updates.emotionSadness = Math.max(0, npc.emotionSadness - 3);
    }

    // Calculate derived emotions
    updates.emotionLove = Math.floor((npc.emotionHappiness + npc.emotionTrust) / 2);
    updates.emotionDesperation = Math.floor(
      (npc.emotionFear + npc.emotionSadness + (100 - avgNeeds)) / 3
    );
    updates.emotionGrief = Math.floor(
      (npc.emotionSadness * 2 + (100 - npc.needSocial)) / 3
    );

    await this.db.nPC.update({
      where: { id: this.id },
      data: updates
    });
  }

  /**
   * Evaluate and update goals based on needs and personality
   */
  private async evaluateGoals(): Promise<void> {
    const npc = await this.db.nPC.findUnique({ 
      where: { id: this.id },
      include: { goals: true }
    });
    if (!npc) return;

    // Check if we need urgent goals based on needs
    
    // FOOD CRISIS
    if (npc.needFood < 20) {
      const hasFoodGoal = npc.goals.some(g => g.type === 'survival');
      if (!hasFoodGoal) {
        await this.db.goal.create({
          data: {
            npcId: this.id,
            type: 'survival',
            priority: 100,
            urgent: true,
            desperate: npc.needFood < 10,
          }
        });
        console.log(`💡 ${npc.name} is hungry! Created survival goal.`);
      }
    }

    // SAFETY CRISIS
    if (npc.needSafety < 30) {
      const hasSafetyGoal = npc.goals.some(g => g.type === 'escape');
      if (!hasSafetyGoal) {
        await this.db.goal.create({
          data: {
            npcId: this.id,
            type: 'escape',
            priority: 90,
            urgent: true,
            desperate: npc.needSafety < 15,
          }
        });
        console.log(`💡 ${npc.name} feels unsafe! Created escape goal.`);
      }
    }

    // Update goal priorities based on current state
    for (const goal of npc.goals) {
      let newPriority = goal.priority;

      // Increase priority if desperate
      if (goal.urgent && !goal.desperate) {
        newPriority = Math.min(100, newPriority + 10);
      }

      // Decrease priority if needs are met
      if (goal.type === 'survival' && npc.needFood > 50) {
        newPriority = Math.max(0, newPriority - 20);
      }

      if (newPriority !== goal.priority) {
        await this.db.goal.update({
          where: { id: goal.id },
          data: { priority: newPriority }
        });
      }
    }
  }

  /**
   * Take action on highest priority goal
   */
  private async takeAction(day: number, hour: number): Promise<void> {
    const npc = await this.db.nPC.findUnique({ 
      where: { id: this.id },
      include: { 
        goals: { 
          where: { completed: false, failed: false },
          orderBy: { priority: 'desc' }
        }
      }
    });
    if (!npc || npc.goals.length === 0) return;

    const topGoal = npc.goals[0];

    // Plan action based on goal type
    const action = this.planAction(topGoal, npc);
    
    if (action) {
      await this.executeAction(action, day, hour);
    }
  }

  /**
   * Plan an action based on goal and NPC state
   */
  private planAction(goal: any, npc: any): Action | null {
    switch (goal.type) {
      case 'survival':
        // If hungry, plan to find food
        if (npc.needFood < 50) {
          return {
            type: 'seek_food',
            duration: 1 // 1 hour
          };
        }
        break;

      case 'escape':
        // If unsafe, plan to move to safe location
        return {
          type: 'seek_shelter',
          duration: 1
        };

      case 'rescue':
        // Plan to search for target
        return {
          type: 'search',
          target: goal.target,
          duration: 2
        };

      default:
        return null;
    }

    return null;
  }

  /**
   * Execute an action
   */
  private async executeAction(action: Action, day: number, hour: number): Promise<void> {
    const npc = await this.db.nPC.findUnique({ where: { id: this.id } });
    if (!npc) return;

    console.log(`🎬 ${npc.name} executes action: ${action.type}`);

    switch (action.type) {
      case 'seek_food':
        // Simulate finding food
        const foodGain = 30 + Math.random() * 20;
        await this.db.nPC.update({
          where: { id: this.id },
          data: { needFood: Math.min(100, npc.needFood + foodGain) }
        });
        console.log(`  🍞 ${npc.name} found food (+${Math.floor(foodGain)})`);
        
        // Create memory
        await this.addMemory({
          day,
          event: 'found_food',
          emotion: 'relief',
          emotionalImpact: 40,
          involvedNpcs: []
        });
        break;

      case 'seek_shelter':
        // Simulate finding shelter
        await this.db.nPC.update({
          where: { id: this.id },
          data: { needSafety: Math.min(100, npc.needSafety + 50) }
        });
        console.log(`  🏠 ${npc.name} found shelter`);
        break;

      case 'search':
        // Simulate searching for someone/something
        console.log(`  🔍 ${npc.name} searches for ${action.target}`);
        // This would check actual game state
        break;
    }
  }

  /**
   * Add a memory for this NPC
   */
  private async addMemory(memory: MemoryEntry): Promise<void> {
    await this.db.memory.create({
      data: {
        npcId: this.id,
        day: memory.day,
        event: memory.event,
        emotion: memory.emotion,
        emotionalImpact: memory.emotionalImpact,
        involvedNpcs: safeJsonStringify(memory.involvedNpcs)
      }
    });
  }

  /**
   * Get NPC's current state
   */
  async getState(): Promise<any> {
    const npc = await this.db.nPC.findUnique({
      where: { id: this.id },
      include: {
        goals: { orderBy: { priority: 'desc' } },
        memories: { orderBy: { day: 'desc' }, take: 10 },
        location: true
      }
    });
    return npc;
  }
}
