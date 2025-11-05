// need-based-behavior.ts - Dynamic NPC behavior based on needs with security override

export type ActivityType =
  | "working" // At workplace, producing resources
  | "eating" // At tavern/home, recovering food need
  | "socializing" // At tavern/market, recovering social need
  | "resting" // At home, recovering energy
  | "fleeing" // At town entrance, security critical
  | "idle"; // At home, no pressing needs

export type LocationType =
  | "home"
  | "workplace"
  | "tavern"
  | "market"
  | "temple"
  | "town-entrance";

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  x: number;
  y: number;
  capacity?: number;
  residents?: string[]; // For homes - NPCs who live here
  ambience?: string;
  description?: string;
}

export interface NPCBehaviorState {
  name: string;
  occupation: string;

  // Needs (0-100)
  needFood: number;
  needSafety: number;
  needWealth: number;
  needSocial: number;
  needRest: number; // New: energy/fatigue

  // Current state
  currentLocation: string;
  currentActivity: ActivityType;

  // Assigned locations
  home: string;
  workplace: string;
}

export interface NPCDecision {
  location: string;
  activity: ActivityType;
  reason: string; // For logging/narration
  priority: number;
}

/**
 * CRITICAL THRESHOLDS
 */
const THRESHOLDS = {
  SECURITY_CRITICAL: 20, // Below this = FLEE!
  SECURITY_LOW: 40, // Below this = prefer safe locations
  HUNGER_CRITICAL: 25, // Must eat NOW
  HUNGER_LOW: 50, // Should eat soon
  WEALTH_LOW: 40, // Need to work
  SOCIAL_LOW: 30, // Need social interaction
  REST_LOW: 25, // Need to sleep
};

/**
 * Need-based behavior system with security override
 */
export class NeedBasedBehavior {
  /**
   * Main decision function - determines what NPC should do
   */
  decideAction(npc: NPCBehaviorState, currentHour: number): NPCDecision {
    console.log(`\n🧠 ${npc.name} is deciding what to do...`);
    console.log(
      `   Needs: Food(${npc.needFood}) Safety(${npc.needSafety}) Wealth(${npc.needWealth}) Social(${npc.needSocial}) Rest(${npc.needRest})`
    );

    // CRITICAL: Security override - flee if in danger!
    if (npc.needSafety < THRESHOLDS.SECURITY_CRITICAL) {
      console.log(`   ⚠️  CRITICAL SECURITY! Fleeing to safety!`);
      return {
        location: "town-entrance",
        activity: "fleeing",
        reason: `Security critical (${npc.needSafety}%) - fleeing to town entrance`,
        priority: 1000, // Highest priority
      };
    }

    // Night time (22-6) - prefer rest if tired
    if (
      (currentHour >= 22 || currentHour < 6) &&
      npc.needRest < THRESHOLDS.REST_LOW
    ) {
      console.log(`   😴 Night time and tired - going home to rest`);
      return {
        location: npc.home,
        activity: "resting",
        reason: `Exhausted (${npc.needRest}%) and it's night`,
        priority: 80,
      };
    }

    // Critical hunger - must eat NOW
    if (npc.needFood < THRESHOLDS.HUNGER_CRITICAL) {
      console.log(`   🍽️  STARVING! Must eat immediately!`);
      return {
        location: "tavern",
        activity: "eating",
        reason: `Critical hunger (${npc.needFood}%)`,
        priority: 90,
      };
    }

    // Evaluate all possible actions and pick best
    const options: NPCDecision[] = [];

    // Option: Work (if wealth low)
    if (npc.needWealth < THRESHOLDS.WEALTH_LOW && npc.workplace) {
      const priority = 100 - npc.needWealth;
      options.push({
        location: npc.workplace,
        activity: "working",
        reason: `Need money (${npc.needWealth}%)`,
        priority,
      });
      console.log(`   💰 Could work (priority: ${priority})`);
    }

    // Option: Eat (if hungry)
    if (npc.needFood < THRESHOLDS.HUNGER_LOW) {
      const priority = (100 - npc.needFood) * 0.8;
      options.push({
        location: "tavern",
        activity: "eating",
        reason: `Hungry (${npc.needFood}%)`,
        priority,
      });
      console.log(`   🍽️  Could eat (priority: ${priority})`);
    }

    // Option: Socialize (if lonely)
    if (npc.needSocial < THRESHOLDS.SOCIAL_LOW) {
      const priority = (100 - npc.needSocial) * 0.7;

      // Low security? Socialize at home instead of tavern
      const location =
        npc.needSafety < THRESHOLDS.SECURITY_LOW ? npc.home : "tavern";

      options.push({
        location,
        activity: "socializing",
        reason: `Lonely (${npc.needSocial}%)`,
        priority,
      });
      console.log(`   👥 Could socialize (priority: ${priority})`);
    }

    // Option: Rest (if tired)
    if (npc.needRest < THRESHOLDS.REST_LOW) {
      const priority = (100 - npc.needRest) * 0.6;
      options.push({
        location: npc.home,
        activity: "resting",
        reason: `Tired (${npc.needRest}%)`,
        priority,
      });
      console.log(`   😴 Could rest (priority: ${priority})`);
    }

    // Pick highest priority action
    if (options.length > 0) {
      options.sort((a, b) => b.priority - a.priority);
      const chosen = options[0];
      console.log(`   ✅ Decision: ${chosen.activity} at ${chosen.location}`);
      console.log(`   📋 Reason: ${chosen.reason}`);
      return chosen;
    }

    // Default: idle at home
    console.log(`   💭 All needs satisfied - relaxing at home`);
    return {
      location: npc.home,
      activity: "idle",
      reason: "All needs satisfied",
      priority: 0,
    };
  }

  /**
   * Decay needs between checkpoints
   */
  decayNeeds(npc: NPCBehaviorState, hours: number): void {
    const decayRate = {
      food: 8, // Decay 8 per checkpoint (gets hungry)
      safety: 2, // Decay 2 per checkpoint (slight anxiety)
      wealth: 5, // Decay 5 per checkpoint (needs money)
      social: 6, // Decay 6 per checkpoint (gets lonely)
      rest: 10, // Decay 10 per checkpoint (gets tired)
    };

    npc.needFood = Math.max(0, npc.needFood - decayRate.food);
    npc.needSafety = Math.max(0, npc.needSafety - decayRate.safety);
    npc.needWealth = Math.max(0, npc.needWealth - decayRate.wealth);
    npc.needSocial = Math.max(0, npc.needSocial - decayRate.social);
    npc.needRest = Math.max(0, npc.needRest - decayRate.rest);

    console.log(
      `⏬ Needs decayed for ${npc.name}:`,
      `Food(${npc.needFood}) Safety(${npc.needSafety}) Wealth(${npc.needWealth}) Social(${npc.needSocial}) Rest(${npc.needRest})`
    );
  }

  /**
   * Recover needs based on current activity
   */
  recoverNeeds(npc: NPCBehaviorState, activity: ActivityType): void {
    const recovery = {
      working: { wealth: 15, rest: -5 }, // Gain wealth, lose rest
      eating: { food: 30, social: 5 }, // Gain food, bit of social
      socializing: { social: 20, food: -3 }, // Gain social, bit hungry
      resting: { rest: 40, food: -5 }, // Gain rest, bit hungry
      fleeing: { safety: -10 }, // Safety keeps dropping while fleeing
      idle: { rest: 10, social: -2 }, // Slight rest, bit lonely
    };

    const changes = recovery[activity] || {};

    for (const [need, amount] of Object.entries(changes)) {
      const needKey = `need${
        need.charAt(0).toUpperCase() + need.slice(1)
      }` as keyof NPCBehaviorState;
      const current = npc[needKey] as number;
      (npc[needKey] as number) = Math.min(100, Math.max(0, current + amount));
    }

    console.log(`♻️  ${npc.name} recovered from ${activity}`);
  }

  /**
   * Get activity emoji for display
   */
  getActivityEmoji(activity: ActivityType): string {
    const emojis: Record<ActivityType, string> = {
      working: "🔨",
      eating: "🍽️",
      socializing: "👥",
      resting: "😴",
      fleeing: "🏃",
      idle: "💭",
    };
    return emojis[activity];
  }

  /**
   * Get activity description for narration
   */
  getActivityDescription(npc: NPCBehaviorState, location: Location): string {
    const { currentActivity } = npc;

    const descriptions: Record<ActivityType, string> = {
      working: `${npc.name} is hard at work at ${location.name}, focused on their craft.`,
      eating: `${npc.name} is enjoying a meal at ${location.name}.`,
      socializing: `${npc.name} is chatting and relaxing at ${location.name}.`,
      resting: `${npc.name} is resting peacefully at ${location.name}.`,
      fleeing: `${npc.name} has fled to ${location.name}, seeking safety!`,
      idle: `${npc.name} is relaxing at ${location.name}.`,
    };

    return descriptions[currentActivity];
  }
}
