// threat-system.ts - Distance-based threat sources for spatial safety

export interface ThreatSource {
  id: string;
  type: 'wolf_den' | 'bandit_camp' | 'monster_lair' | 'plague_zone' | 'haunted_ruins' | 'player';
  name: string;
  x: number;              // Map coordinates
  y: number;
  radius: number;         // Threat influence radius
  severity: number;       // 0-100, how dangerous
  active: boolean;        // Can be disabled when cleared
  description: string;
  mobile?: boolean;       // For threats that can move (like player)
}

// Convert existing crisis zones to threat sources
export const THREAT_SOURCES: ThreatSource[] = [
  {
    id: 'threat_1',
    type: 'bandit_camp',
    name: 'North Bandit Camp',
    x: 450,
    y: 150,
    radius: 100,
    severity: 75,
    active: true,
    description: 'A dangerous bandit hideout controlling the northern roads'
  },
  {
    id: 'threat_2',
    type: 'plague_zone',
    name: 'Abandoned Village',
    x: 900,
    y: 200,
    radius: 80,
    severity: 60,
    active: true,
    description: 'Disease-ridden ruins of a once thriving village'
  },
  {
    id: 'threat_3',
    type: 'haunted_ruins',
    name: 'Old Cemetery',
    x: 150,
    y: 800,
    radius: 60,
    severity: 45,
    active: true,
    description: 'Ancient burial grounds with restless spirits'
  },
  {
    id: 'threat_4',
    type: 'wolf_den',
    name: 'Western Wolf Den',
    x: 100,
    y: 400,
    radius: 120,
    severity: 80,
    active: true,
    description: 'Large wolf pack terrorizing the western approaches'
  },
  {
    id: 'threat_5',
    type: 'monster_lair',
    name: 'Cave of Despair',
    x: 1400,
    y: 600,
    radius: 90,
    severity: 70,
    active: true,
    description: 'Unknown creatures lurk in these dark caverns'
  },
  {
    id: 'player_threat',
    type: 'player',
    name: 'Unknown Stranger',
    x: 400,  // Will be updated dynamically
    y: 300,  // Will be updated dynamically
    radius: 80,  // Player's threat radius
    severity: 50,  // Moderate threat level
    active: true,
    description: 'A mysterious stranger whose intentions are unknown',
    mobile: true
  }
];

/**
 * Calculate distance between two points
 */
export function calculateDistance(
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Calculate threat impact using inverse square law
 * Closer threats have exponentially worse impact
 */
export function calculateThreatImpact(
  distance: number,
  threatRadius: number,
  threatSeverity: number
): number {
  // No impact if outside threat radius
  if (distance > threatRadius) return 0;
  
  // Inverse square law: closer = much worse
  const proximityFactor = 1 - (distance / threatRadius);
  const impact = threatSeverity * Math.pow(proximityFactor, 2);
  
  return Math.min(100, impact);
}

/**
 * Find all threats affecting a specific position
 */
export function getThreatsAtPosition(
  x: number,
  y: number,
  threats: ThreatSource[] = THREAT_SOURCES
): Array<{ threat: ThreatSource; distance: number; impact: number }> {
  const activeThreats = threats.filter(t => t.active);
  const affecting: Array<{ threat: ThreatSource; distance: number; impact: number }> = [];
  
  for (const threat of activeThreats) {
    const distance = calculateDistance(x, y, threat.x, threat.y);
    const impact = calculateThreatImpact(distance, threat.radius, threat.severity);
    
    if (impact > 0) {
      affecting.push({ threat, distance, impact });
    }
  }
  
  // Sort by impact (highest first)
  return affecting.sort((a, b) => b.impact - a.impact);
}

/**
 * Calculate safety at a specific position
 * Takes into account all nearby threats
 */
export function calculatePositionSafety(
  x: number,
  y: number,
  baseSafety: number = 100,
  threats: ThreatSource[] = THREAT_SOURCES
): number {
  const affectingThreats = getThreatsAtPosition(x, y, threats);
  
  // Sum up all threat impacts
  const totalImpact = affectingThreats.reduce((sum, { impact }) => sum + impact, 0);
  
  // Cap total impact at base safety
  const cappedImpact = Math.min(totalImpact, baseSafety);
  
  return Math.max(0, baseSafety - cappedImpact);
}

/**
 * Get the nearest K threats to a position
 * Useful for performance optimization
 */
export function findKNearestThreats(
  x: number,
  y: number,
  k: number = 3,
  threats: ThreatSource[] = THREAT_SOURCES
): Array<{ threat: ThreatSource; distance: number }> {
  const activeThreats = threats.filter(t => t.active);
  
  const distances = activeThreats.map(threat => ({
    threat,
    distance: calculateDistance(x, y, threat.x, threat.y)
  }));
  
  // Sort by distance and take K nearest
  return distances
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);
}

/**
 * Get threat severity multiplier based on type
 * Some threats are inherently more dangerous
 */
export function getThreatTypeMultiplier(type: ThreatSource['type']): number {
  const multipliers: Record<ThreatSource['type'], number> = {
    'wolf_den': 1.2,        // Wolves actively hunt
    'bandit_camp': 1.0,     // Bandits are organized
    'monster_lair': 1.1,    // Unknown dangers
    'plague_zone': 0.8,     // Passive threat
    'haunted_ruins': 0.7    // Mostly psychological
  };
  
  return multipliers[type] || 1.0;
}

/**
 * Visual representation helpers for threats
 */
export function getThreatColor(type: ThreatSource['type']): number {
  const colors: Record<ThreatSource['type'], number> = {
    'bandit_camp': 0x8b0000,     // Dark red
    'plague_zone': 0x556b2f,     // Dark olive green
    'haunted_ruins': 0x483d8b,   // Dark slate blue
    'wolf_den': 0x8b4513,        // Saddle brown
    'monster_lair': 0x4b0082,    // Indigo
    'player': 0xff4444           // Bright red for player danger
  };
  
  return colors[type] || 0x666666;
}

export function getThreatEmoji(type: ThreatSource['type']): string {
  const emojis: Record<ThreatSource['type'], string> = {
    'wolf_den': '🐺',
    'bandit_camp': '⚔️',
    'monster_lair': '👹',
    'plague_zone': '☠️',
    'haunted_ruins': '👻',
    'player': '👤'
  };
  
  return emojis[type] || '⚠️';
}