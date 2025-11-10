// town-safety-system.ts - Calculate safety at town/area level

import { ThreatSource, calculateDistance, calculateThreatImpact } from './threat-system';
import { NPCBehaviorState } from './need-based-behavior';

export interface Town {
  id: string;
  name: string;
  x: number;              // Town center coordinates
  y: number;
  radius: number;         // Town boundary/influence
  population: number;
  baseSafety: number;     // 0-100, safety without external threats
  currentSafety: number;  // Calculated from active threats
}

// Define the main towns in our world
export const TOWNS: Town[] = [
  {
    id: 'town_1',
    name: 'Millhaven',
    x: 600,
    y: 400,
    radius: 150,
    population: 3,  // Gareth, Sarah, Emma
    baseSafety: 80,
    currentSafety: 80
  }
];

/**
 * Calculate town-level safety from all active threats
 * Uses inverse square law: closer threats have exponentially worse impact
 */
export function calculateTownSafety(town: Town, threats: ThreatSource[]): number {
  let safetyImpact = 0;

  for (const threat of threats) {
    if (!threat.active) continue;

    // Calculate distance from town center to threat
    const distance = calculateDistance(town.x, town.y, threat.x, threat.y);

    // Threats within combined radius affect town
    const maxInfluenceDistance = town.radius + threat.radius;

    if (distance < maxInfluenceDistance) {
      // Calculate threat impact
      const impact = calculateThreatImpact(distance, maxInfluenceDistance, threat.severity);
      safetyImpact += impact;
    }
  }

  // Cap total impact at town's base safety
  safetyImpact = Math.min(safetyImpact, town.baseSafety);

  return Math.max(0, town.baseSafety - safetyImpact);
}

/**
 * Get the town an NPC belongs to based on their home location
 */
export function getNPCTown(npc: NPCBehaviorState, towns: Town[] = TOWNS): Town | undefined {
  if (npc.homeX === undefined || npc.homeY === undefined) return undefined;

  // Find the town that contains this NPC's home
  for (const town of towns) {
    const distance = calculateDistance(npc.homeX, npc.homeY, town.x, town.y);
    if (distance <= town.radius) {
      return town;
    }
  }

  return undefined;
}

/**
 * Calculate average safety for all NPCs in a town
 */
export function calculateTownNPCAverage(
  townId: string, 
  npcs: NPCBehaviorState[]
): number {
  const townNPCs = npcs.filter(npc => {
    const town = getNPCTown(npc);
    return town?.id === townId;
  });

  if (townNPCs.length === 0) return 0;

  const totalSafety = townNPCs.reduce((sum, npc) => sum + (npc.needSafety || 0), 0);
  return totalSafety / townNPCs.length;
}

/**
 * Update all towns' safety values when threats change
 */
export function recalculateAllTownSafety(towns: Town[], threats: ThreatSource[]): void {
  for (const town of towns) {
    town.currentSafety = calculateTownSafety(town, threats);
    console.log(`📍 ${town.name} safety: ${town.currentSafety.toFixed(1)}/100`);
  }
}

/**
 * Get a summary of town safety levels
 */
export function getTownSafetySummary(towns: Town[] = TOWNS): string {
  const summaries = towns.map(town => {
    const safetyLevel = 
      town.currentSafety >= 70 ? '🟢 Safe' :
      town.currentSafety >= 40 ? '🟡 Caution' :
      '🔴 Danger';
    
    return `${town.name}: ${safetyLevel} (${town.currentSafety.toFixed(0)}/100)`;
  });

  return summaries.join(' | ');
}

/**
 * Calculate individual NPC safety based on town safety + proximity adjustment
 */
export function calculateNPCSafetyFromTown(
  npc: NPCBehaviorState,
  town: Town,
  threats: ThreatSource[]
): number {
  // Start with town's current safety
  let npcSafety = town.currentSafety;

  if (npc.currentX === undefined || npc.currentY === undefined) {
    return npcSafety;
  }

  // Find nearest threats to this NPC
  const nearbyThreats: Array<{ threat: ThreatSource; distance: number }> = [];
  
  for (const threat of threats) {
    if (!threat.active) continue;
    
    const distance = calculateDistance(npc.currentX, npc.currentY, threat.x, threat.y);
    if (distance < threat.radius * 1.5) {
      nearbyThreats.push({ threat, distance });
    }
  }

  // Sort by distance
  nearbyThreats.sort((a, b) => a.distance - b.distance);

  // Apply additional penalty if NPC is closer to threats than town center
  for (const { threat, distance } of nearbyThreats.slice(0, 3)) { // Top 3 nearest
    const townToThreat = calculateDistance(town.x, town.y, threat.x, threat.y);

    // Only apply additional penalty if NPC is closer than town center
    if (distance < townToThreat) {
      const proximityPenalty = calculateThreatImpact(
        distance, 
        threat.radius, 
        threat.severity * 0.3  // 30% additional penalty
      );
      npcSafety -= proximityPenalty;
    }
  }

  return Math.max(0, Math.min(100, npcSafety));
}

/**
 * Visualize town boundaries
 */
export function getTownVisualizationData(town: Town): {
  color: number;
  alpha: number;
} {
  const safetyRatio = town.currentSafety / 100;
  
  // Green to red gradient based on safety
  const red = Math.round(255 * (1 - safetyRatio));
  const green = Math.round(255 * safetyRatio);
  const color = (red << 16) + (green << 8);
  
  return {
    color,
    alpha: 0.2 + (0.3 * (1 - safetyRatio)) // More opaque when dangerous
  };
}