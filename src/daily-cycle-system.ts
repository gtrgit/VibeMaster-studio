// daily-cycle-system.ts - Manages 4 daily checkpoints and NPC updates

import {
  NeedBasedBehavior,
  NPCBehaviorState,
  NPCDecision,
} from "./need-based-behavior";
import { LocationSystem } from "./location-system";
import { applyBuildingEffects } from "./building-effects";

/**
 * Daily cycle with 4 checkpoints: Dawn, Midday, Evening, Night
 */
export class DailyCycleSystem {
  private behaviorSystem: NeedBasedBehavior;
  private locationSystem: LocationSystem;
  private npcs: Map<string, NPCBehaviorState> = new Map();
  private lastCheckpointHour: number = -1;
  private messageCallback?: (npcName: string, message: string) => void;
  private movementCallback?: (npcName: string, toLocationId: string) => void;

  // 4 checkpoints per day
  readonly CHECKPOINTS = [6, 12, 18, 22];
  readonly CHECKPOINT_NAMES: Record<number, string> = {
    6: "Dawn",
    12: "Midday",
    18: "Evening",
    22: "Night",
  };

  constructor(locationSystem: LocationSystem) {
    this.behaviorSystem = new NeedBasedBehavior();
    this.locationSystem = locationSystem;
  }

  setMessageCallback(callback: (npcName: string, message: string) => void): void {
    this.messageCallback = callback;
  }

  setMovementCallback(callback: (npcName: string, toLocationId: string) => void): void {
    this.movementCallback = callback;
  }

  /**
   * Register an NPC in the system
   */
  registerNPC(npc: NPCBehaviorState): void {
    // Assign home if not set
    if (!npc.home) {
      npc.home = this.locationSystem.assignNPCToHome(npc.name);
    }

    // Assign workplace if not set
    if (!npc.workplace && npc.occupation) {
      const workplace = this.locationSystem.assignWorkplace(
        npc.name,
        npc.occupation
      );
      if (workplace) {
        npc.workplace = workplace;
      }
    }

    // Set spatial coordinates based on assigned locations
    if (npc.home) {
      const homeLoc = this.locationSystem.getLocation(npc.home);
      if (homeLoc) {
        npc.homeX = homeLoc.x;
        npc.homeY = homeLoc.y;
      }
    }
    
    if (npc.workplace) {
      const workLoc = this.locationSystem.getLocation(npc.workplace);
      if (workLoc) {
        npc.workX = workLoc.x;
        npc.workY = workLoc.y;
      }
    }

    // Set initial location to home
    if (!npc.currentLocation) {
      npc.currentLocation = npc.home;
      npc.currentActivity = "resting";
      npc.currentX = npc.homeX;
      npc.currentY = npc.homeY;
    }

    this.npcs.set(npc.name, npc);
    console.log(
      `✅ Registered ${npc.name} (home: ${npc.home}, workplace: ${
        npc.workplace || "none"
      })`
    );
  }

  /**
   * Get NPC by name
   */
  getNPC(name: string): NPCBehaviorState | undefined {
    return this.npcs.get(name);
  }

  /**
   * Get all NPCs
   */
  getAllNPCs(): NPCBehaviorState[] {
    return Array.from(this.npcs.values());
  }

  /**
   * Get NPCs at a specific location
   */
  getNPCsAtLocation(locationId: string): NPCBehaviorState[] {
    return Array.from(this.npcs.values()).filter(
      (npc) => npc.currentLocation === locationId
    );
  }

  /**
   * Main update - called every hour
   */
  onHourChange(newHour: number): void {
    const isCheckpoint = this.CHECKPOINTS.includes(newHour);

    if (isCheckpoint && newHour !== this.lastCheckpointHour) {
      this.runCheckpoint(newHour);
      this.lastCheckpointHour = newHour;
    } else {
      // Run a lighter evaluation every hour for activity changes
      this.runHourlyEvaluation(newHour);
    }
  }

  /**
   * Run a checkpoint - evaluate all NPCs
   */
  private runCheckpoint(hour: number): void {
    const checkpointName = this.CHECKPOINT_NAMES[hour];

    console.log(`\n${"=".repeat(70)}`);
    console.log(`🌅 ${checkpointName.toUpperCase()} CHECKPOINT (Hour ${hour})`);
    console.log("=".repeat(70));

    // 1. Decay all needs
    console.log("\n⏬ === NEED DECAY ===");
    for (const npc of this.npcs.values()) {
      this.behaviorSystem.decayNeeds(npc, 1);
    }

    // 2. Check for fleeing NPCs (critical security)
    console.log("\n🏃 === SECURITY CHECK ===");
    const fleeingNPCs = Array.from(this.npcs.values()).filter(
      (npc) => npc.needSafety < 20
    );

    if (fleeingNPCs.length > 0) {
      console.log(
        `⚠️  ${fleeingNPCs.length} NPCs have critical security and are fleeing!`
      );
      for (const npc of fleeingNPCs) {
        console.log(`   🏃 ${npc.name}: Safety(${npc.needSafety}%) - FLEEING!`);
      }
    } else {
      console.log("✅ All NPCs feel safe");
    }

    // 3. Decide actions for all NPCs
    console.log("\n🧠 === NPC DECISIONS ===");
    const decisions: Map<string, NPCDecision> = new Map();

    for (const npc of this.npcs.values()) {
      const decision = this.behaviorSystem.decideAction(npc, hour);
      decisions.set(npc.name, decision);
    }

    // 4. Move NPCs to new locations
    console.log("\n🚶 === NPC MOVEMENT ===");
    for (const [npcName, decision] of decisions.entries()) {
      const npc = this.npcs.get(npcName)!;
      const oldLocation = npc.currentLocation;
      const newLocation = decision.location;

      if (oldLocation !== newLocation) {
        const oldActivity = npc.currentActivity;
        npc.currentLocation = newLocation;
        npc.currentActivity = decision.activity;

        const fromLoc = this.locationSystem.getLocation(oldLocation);
        const toLoc = this.locationSystem.getLocation(newLocation);

        // Update spatial coordinates (final destination)
        if (toLoc) {
          // Note: Visual position will be updated by tween, but we set the logical position
          npc.currentX = toLoc.x;
          npc.currentY = toLoc.y;
        }

        console.log(
          `   🚶 ${npcName}: ${fromLoc?.name || oldLocation} → ${
            toLoc?.name || newLocation
          }`
        );
        console.log(
          `      Activity: ${decision.activity} (${decision.reason})`
        );

        // Trigger movement animation
        this.movementCallback?.(npcName, newLocation);

        // Log activity change
        const locationName = toLoc?.name || newLocation;
        this.messageCallback?.(npcName, `Moved to ${locationName}`);
        if (oldActivity !== decision.activity) {
          this.messageCallback?.(npcName, `Started ${decision.activity}`);
        }
      } else {
        const oldActivity = npc.currentActivity;
        console.log(
          `   ⏸️  ${npcName}: Staying at ${
            this.locationSystem.getLocation(newLocation)?.name || newLocation
          }`
        );
        npc.currentActivity = decision.activity;
        
        // Log activity change if different
        if (oldActivity !== decision.activity) {
          this.messageCallback?.(npcName, `Started ${decision.activity}`);
        }
      }
    }

    // 5. Show location summary
    console.log("\n📍 === LOCATION SUMMARY ===");
    this.logLocationOccupancy();

    console.log(`\n${"=".repeat(70)}\n`);
  }

  /**
   * Run hourly evaluation - allows NPCs to change activities between checkpoints
   */
  private runHourlyEvaluation(hour: number): void {
    console.log(`\n⏰ Hour ${hour} - Hourly activity check`);

    for (const npc of this.npcs.values()) {
      const oldActivity = npc.currentActivity;
      
      // Special handling for eating - should only last 1 hour
      if (npc.currentActivity === "eating" && npc.needFood > 70) {
        console.log(`   ${npc.name}: Finished eating (Food: ${npc.needFood}%)`);
        
        // Re-evaluate what to do next
        const decision = this.behaviorSystem.decideAction(npc, hour);
        
        if (decision.activity !== oldActivity) {
          npc.currentActivity = decision.activity;
          
          // Move if needed
          if (decision.location !== npc.currentLocation) {
            const fromLoc = this.locationSystem.getLocation(npc.currentLocation);
            const toLoc = this.locationSystem.getLocation(decision.location);
            
            npc.currentLocation = decision.location;
            
            // Update spatial coordinates (final destination)
            if (toLoc) {
              npc.currentX = toLoc.x;
              npc.currentY = toLoc.y;
            }
            
            console.log(`   ${npc.name}: ${fromLoc?.name} → ${toLoc?.name}`);
            
            // Trigger movement animation
            this.movementCallback?.(npc.name, decision.location);
            
            this.messageCallback?.(npc.name, `Moved to ${toLoc?.name || decision.location}`);
          }
          
          this.messageCallback?.(npc.name, `Started ${decision.activity}`);
          console.log(`   ${npc.name}: Now ${decision.activity}`);
        }
      }
      
      // Also re-evaluate if activity is "idle"
      else if (npc.currentActivity === "idle") {
        const decision = this.behaviorSystem.decideAction(npc, hour);
        
        if (decision.activity !== oldActivity) {
          npc.currentActivity = decision.activity;
          
          if (decision.location !== npc.currentLocation) {
            const fromLoc = this.locationSystem.getLocation(npc.currentLocation);
            const toLoc = this.locationSystem.getLocation(decision.location);
            
            npc.currentLocation = decision.location;
            
            // Update spatial coordinates (final destination)
            if (toLoc) {
              npc.currentX = toLoc.x;
              npc.currentY = toLoc.y;
            }
            
            console.log(`   ${npc.name}: ${fromLoc?.name} → ${toLoc?.name}`);
            
            // Trigger movement animation
            this.movementCallback?.(npc.name, decision.location);
            
            this.messageCallback?.(npc.name, `Moved to ${toLoc?.name || decision.location}`);
          }
          
          this.messageCallback?.(npc.name, `Started ${decision.activity}`);
          console.log(`   ${npc.name}: Now ${decision.activity}`);
        }
      }
    }
  }

  /**
   * Log which NPCs are at each location
   */
  private logLocationOccupancy(): void {
    const occupancy: Map<string, string[]> = new Map();

    // Group NPCs by location
    for (const npc of this.npcs.values()) {
      const loc = npc.currentLocation;
      if (!occupancy.has(loc)) {
        occupancy.set(loc, []);
      }
      occupancy.get(loc)!.push(`${npc.name} (${npc.currentActivity})`);
    }

    // Display
    for (const [locId, npcNames] of occupancy.entries()) {
      const location = this.locationSystem.getLocation(locId);
      const locName = location?.name || locId;
      const emoji = this.getLocationEmoji(location?.type);

      console.log(`   ${emoji} ${locName}:`);
      for (const name of npcNames) {
        console.log(`      - ${name}`);
      }
    }
  }

  /**
   * Get emoji for location type
   */
  private getLocationEmoji(type?: string): string {
    const emojis: Record<string, string> = {
      home: "🏠",
      workplace: "🔨",
      tavern: "🍺",
      market: "🏪",
      temple: "⛪",
      "town-entrance": "🛡️",
    };
    return emojis[type || ""] || "📍";
  }

  /**
   * Update NPC needs based on their activity (called continuously)
   */
  updateNPCNeeds(): void {
    for (const npc of this.npcs.values()) {
      // Apply activity-based recovery
      this.behaviorSystem.recoverNeeds(npc, npc.currentActivity, this.messageCallback);
      
      // Apply building-based effects
      const location = this.locationSystem.getLocation(npc.currentLocation);
      if (location?.type) {
        // Count other NPCs at the same location
        const otherNPCs = this.getNPCsAtLocation(npc.currentLocation).length - 1;
        
        // Apply building effects with social bonus
        applyBuildingEffects(npc, location.type, otherNPCs, this.messageCallback);
      }
    }
  }

  /**
   * Manually trigger security threat (for testing)
   */
  triggerSecurityThreat(severity: "minor" | "major" | "critical"): void {
    const securityDrop = {
      minor: 20,
      major: 40,
      critical: 70,
    };

    const drop = securityDrop[severity];

    console.log(`\n⚠️  === SECURITY THREAT: ${severity.toUpperCase()} ===`);
    console.log(`All NPCs lose ${drop} security!`);

    for (const npc of this.npcs.values()) {
      npc.needSafety = Math.max(0, npc.needSafety - drop);
      console.log(`   ${npc.name}: Security now ${npc.needSafety}%`);
    }
  }

  /**
   * Restore security after threat resolved
   */
  restoreSecurity(amount: number = 50): void {
    console.log(`\n✅ === THREAT RESOLVED ===`);
    console.log(`All NPCs recover ${amount} security!`);

    for (const npc of this.npcs.values()) {
      npc.needSafety = Math.min(100, npc.needSafety + amount);
      console.log(`   ${npc.name}: Security now ${npc.needSafety}%`);
    }
  }

  /**
   * Get next checkpoint info
   */
  getNextCheckpoint(currentHour: number): {
    hour: number;
    name: string;
    hoursUntil: number;
  } {
    for (const checkpoint of this.CHECKPOINTS) {
      if (checkpoint > currentHour) {
        return {
          hour: checkpoint,
          name: this.CHECKPOINT_NAMES[checkpoint],
          hoursUntil: checkpoint - currentHour,
        };
      }
    }

    // Next checkpoint is tomorrow's first checkpoint
    return {
      hour: this.CHECKPOINTS[0],
      name: this.CHECKPOINT_NAMES[this.CHECKPOINTS[0]],
      hoursUntil: 24 - currentHour + this.CHECKPOINTS[0],
    };
  }

  /**
   * Get summary for UI display
   */
  getSummary(currentHour: number): string {
    const nextCheckpoint = this.getNextCheckpoint(currentHour);
    const totalNPCs = this.npcs.size;
    const fleeing = Array.from(this.npcs.values()).filter(
      (n) => n.needSafety < 20
    ).length;
    const working = Array.from(this.npcs.values()).filter(
      (n) => n.currentActivity === "working"
    ).length;
    const resting = Array.from(this.npcs.values()).filter(
      (n) => n.currentActivity === "resting"
    ).length;

    let summary = `Next checkpoint: ${nextCheckpoint.name} in ${nextCheckpoint.hoursUntil}h\n`;
    summary += `NPCs: ${totalNPCs} total`;

    if (fleeing > 0) summary += `, ${fleeing} fleeing!`;
    if (working > 0) summary += `, ${working} working`;
    if (resting > 0) summary += `, ${resting} resting`;

    return summary;
  }
}
