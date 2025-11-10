// building-effects.ts - Automatic stat changes based on building location

import { LocationType } from "./need-based-behavior";

export interface BuildingEffect {
  needFood?: number;
  needSafety?: number;
  needWealth?: number;
  needSocial?: number;
  needRest?: number;
  emotionHappiness?: number;
  emotionFear?: number;
}

/**
 * Building effects applied per hour
 * Positive values = gain, negative values = loss
 */
export const BUILDING_EFFECTS: Record<LocationType, BuildingEffect> = {
  home: {
    needRest: 20,        // Gain rest at home
    needFood: -3,        // Slowly get hungry
    needSafety: 20,      // Best place to recover safety (increased from 10)
    emotionHappiness: 5, // Being home is comforting
    emotionFear: -5,     // Feel safer at home
  },
  
  workplace: {
    needWealth: 10,      // Earning money (in addition to production)
    needRest: -8,        // Work is tiring
    needFood: -5,        // Getting hungry while working
    needSocial: 3,       // Some social interaction with coworkers
    needSafety: 3,       // Baseline safety recovery
  },
  
  tavern: {
    needFood: 25,        // Eating/drinking at tavern
    needSocial: 15,      // Great place to socialize
    needWealth: -10,     // Spending money
    emotionHappiness: 10, // Taverns are fun!
    needRest: -3,        // Not very restful
    needSafety: 5,       // Moderate safety recovery
  },
  
  market: {
    needFood: 5,         // Can grab snacks
    needSocial: 8,       // Meet people while shopping
    needWealth: -5,      // Spending some money
    emotionHappiness: 3, // Shopping can be enjoyable
    needSafety: 3,       // Baseline safety recovery
  },
  
  temple: {
    emotionFear: -10,    // Reduces fear/anxiety
    emotionHappiness: 8, // Spiritual comfort
    needSocial: 5,       // Meet other worshippers
    needRest: 5,         // Peaceful environment
    needSafety: 10,      // Good safety recovery
  },
  
  "town-entrance": {
    needSafety: 8,       // Moderate safety (reduced from 15)
    emotionFear: -15,    // Feel protected
    needSocial: 3,       // Chat with guards
  }
};

// Stat icons for visual display
const STAT_ICONS: Record<string, string> = {
  Food: '🍽️',
  Safety: '🛡️',
  Wealth: '💰',
  Social: '👥',
  Rest: '😴',
  Happiness: '😊',
  Fear: '😰'
};

/**
 * Apply building effects to an NPC based on their current location
 * @param npc The NPC to apply effects to
 * @param locationType The type of building they're in
 * @param otherNPCsPresent Number of other NPCs at the same location
 * @param messageCallback Optional callback to log messages
 */
export function applyBuildingEffects(
  npc: any,
  locationType: LocationType,
  otherNPCsPresent: number = 0,
  messageCallback?: (npcName: string, message: string) => void
): void {
  const effects = BUILDING_EFFECTS[locationType];
  if (!effects) return;

  const changes: string[] = [];

  // Apply base building effects
  for (const [stat, change] of Object.entries(effects)) {
    if (change !== 0) {
      const currentValue = npc[stat] || 0;
      const newValue = Math.max(0, Math.min(100, currentValue + change));
      const actualChange = newValue - currentValue;
      npc[stat] = newValue;

      // Log actual changes with icons (not theoretical change)
      if (actualChange !== 0) {
        const statName = stat.replace('need', '').replace('emotion', '');
        const icon = STAT_ICONS[statName] || '';
        const changeStr = actualChange > 0 ? `+${actualChange}` : `${actualChange}`;
        changes.push(`${icon}(${changeStr})`);
      }
    }
  }

  // Apply social bonuses if other NPCs are present
  if (otherNPCsPresent > 0 && locationType !== "workplace") { // Don't double-count workplace social
    const socialBonus = Math.min(10, otherNPCsPresent * 3); // 3 points per NPC, max 10
    npc.needSocial = Math.min(100, (npc.needSocial || 0) + socialBonus);
    npc.emotionHappiness = Math.min(100, (npc.emotionHappiness || 0) + Math.floor(socialBonus / 2));
    
    changes.push(`👥(+${socialBonus})`);
    if (socialBonus / 2 >= 1) {
      changes.push(`😊(+${Math.floor(socialBonus / 2)})`);
    }
  }

  // Special case: Multiple NPCs at home increases happiness more
  if (locationType === "home" && otherNPCsPresent > 0) {
    const happinessBonus = otherNPCsPresent * 3;
    npc.emotionHappiness = Math.min(100, (npc.emotionHappiness || 0) + happinessBonus);
    changes.push(`😊(+${happinessBonus})`);
  }

  // Log the changes as a compact icon string
  if (changes.length > 0 && messageCallback) {
    messageCallback(npc.name, changes.join(' '));
  }
}

/**
 * Get a description of what an NPC is doing at a location
 */
export function getBuildingActivityDescription(
  npcName: string, 
  locationType: LocationType,
  activity: string
): string {
  // If they have a specific activity, use that
  if (activity === "working") {
    return `${npcName} is hard at work`;
  }
  
  // Otherwise, describe typical building activities
  const descriptions: Record<LocationType, string> = {
    home: `${npcName} is relaxing at home`,
    workplace: `${npcName} is at their workplace`,
    tavern: `${npcName} is enjoying food and drinks`,
    market: `${npcName} is browsing the market stalls`,
    temple: `${npcName} is praying quietly`,
    "town-entrance": `${npcName} is near the town guards`,
  };

  return descriptions[locationType] || `${npcName} is here`;
}