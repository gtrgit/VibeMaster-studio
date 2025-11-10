# Hierarchical Spatial Safety System - Top-Down Threat Calculation

**Date:** November 8, 2025
**Status:** Design Specification
**Purpose:** Two-tier spatial safety system that calculates town-level safety from environmental threats, then distributes to individual NPCs based on proximity

---

## 🎯 The Problem

**Bottom-Up Aggregation is Backwards:**
- World creation starts at high level: map → land → towns → threats
- But we were calculating safety at individual NPC level, then trying to aggregate up
- This creates performance problems and doesn't match how the world is structured
- Environmental threats (wolf dens, bandit camps) exist at the map level, not NPC level

**The Solution:**
> "Calculate safety top-down, not bottom-up. Town safety comes from map-level threats, then individual NPCs get adjustments based on their proximity to those threats."

---

## 📊 System Architecture

### Two-Tier Model

```
Map Level (Macro)
├── Continent
├── Threat Sources (wolf dens, bandit camps)
└── Towns
    ├── Town Safety (calculated from threats)
    └── NPCs
        └── Individual Safety (town safety + proximity adjustments)
```

### Tier 1: Macro Level - Town Safety

```typescript
// /src/systems/world/town-safety-system.ts

interface ThreatSource {
  id: string;
  continentId: string;
  type: 'wolf_den' | 'bandit_camp' | 'monster_lair' | 'plague_zone' | 'haunted_ruins' | 'orc_warband';
  x: number;              // Map coordinates
  y: number;
  radius: number;         // Threat influence radius (in map units)
  severity: number;       // 0-100, how dangerous
  active: boolean;        // Can be disabled when cleared
  description?: string;   // "Large wolf pack, 12+ members"
  createdAt: Date;
}

interface Town {
  id: string;
  name: string;
  continentId: string;
  x: number;              // Town center coordinates
  y: number;
  radius: number;         // Town boundary/influence
  population: number;
  baseSafety: number;     // 0-100, safety without external threats
  currentSafety: number;  // Calculated from active threats
  updatedAt: Date;
}

/**
 * Calculate town-level safety from all active threats
 * Uses inverse square law: closer threats have exponentially worse impact
 */
function calculateTownSafety(town: Town, threats: ThreatSource[]): number {
  let safetyImpact = 0;

  for (const threat of threats) {
    if (!threat.active) continue;

    // Calculate distance from town center to threat
    const distance = Math.sqrt(
      Math.pow(town.x - threat.x, 2) +
      Math.pow(town.y - threat.y, 2)
    );

    // Threats within combined radius affect town
    const maxInfluenceDistance = town.radius + threat.radius;

    if (distance < maxInfluenceDistance) {
      // Inverse square law: closer = much worse
      const proximityFactor = 1 - (distance / maxInfluenceDistance);
      const threatImpact = threat.severity * Math.pow(proximityFactor, 2);
      safetyImpact += threatImpact;
    }
  }

  // Cap total impact at town's base safety
  safetyImpact = Math.min(safetyImpact, town.baseSafety);

  return town.baseSafety - safetyImpact;
}

/**
 * Update all towns' safety values when threats change
 */
async function recalculateContinentSafety(continentId: string) {
  const threats = await prisma.threatSource.findMany({
    where: { continentId, active: true }
  });

  const towns = await prisma.town.findMany({
    where: { continentId }
  });

  for (const town of towns) {
    const newSafety = calculateTownSafety(town, threats);

    await prisma.town.update({
      where: { id: town.id },
      data: {
        currentSafety: newSafety,
        updatedAt: new Date()
      }
    });

    // Also recalculate all NPCs in this town
    await recalculateTownNPCSafety(town.id);
  }
}
```

### Tier 2: Micro Level - Individual NPC Safety

```typescript
// /src/systems/world/npc-proximity-safety.ts

interface NPCLocation {
  npcId: string;
  townId: string;
  homeX: number;          // Home location
  homeY: number;
  workX: number;          // Workplace location
  workY: number;
  currentX: number;       // Current position
  currentY: number;
}

/**
 * Calculate individual NPC safety based on proximity to threats
 * Starts with town base safety, then adjusts for personal proximity
 */
function calculateNPCSafety(
  npc: NPCLocation,
  town: Town,
  threats: ThreatSource[]
): number {
  // Start with town's current safety
  let npcSafety = town.currentSafety;

  // Find K nearest active threats (K=3 for performance)
  const nearbyThreats = findKNearestThreats(npc, threats, 3);

  for (const { threat, distance } of nearbyThreats) {
    // Calculate town center's distance to this threat
    const townToThreat = Math.sqrt(
      Math.pow(town.x - threat.x, 2) +
      Math.pow(town.y - threat.y, 2)
    );

    // Only apply additional penalty if NPC is closer than town center
    if (distance < townToThreat) {
      // This NPC is on the dangerous side of town
      const proximityFactor = 1 - (distance / threat.radius);

      if (proximityFactor > 0) {
        // Apply 50% of threat severity as personal penalty
        // (other 50% already factored into town safety)
        const personalThreat = threat.severity * proximityFactor * 0.5;
        npcSafety -= personalThreat;
      }
    }
  }

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, npcSafety));
}

/**
 * Find the K nearest threats to an NPC
 * Checks home, work, and current position - uses closest
 */
function findKNearestThreats(
  npc: NPCLocation,
  threats: ThreatSource[],
  k: number
): Array<{ threat: ThreatSource; distance: number }> {
  // Check all positions where NPC spends time
  const positions = [
    { x: npc.homeX, y: npc.homeY, weight: 0.5 },      // Home is important
    { x: npc.workX, y: npc.workY, weight: 0.3 },      // Work matters
    { x: npc.currentX, y: npc.currentY, weight: 0.2 }  // Current location
  ];

  const threatDistances = threats
    .filter(t => t.active)
    .map(threat => {
      // Calculate weighted average distance
      const distances = positions.map(pos => {
        const dist = Math.sqrt(
          Math.pow(pos.x - threat.x, 2) +
          Math.pow(pos.y - threat.y, 2)
        );
        return dist * pos.weight;
      });

      const weightedDistance = distances.reduce((sum, d) => sum + d, 0);

      return {
        threat,
        distance: weightedDistance
      };
    });

  // Sort by distance and take K nearest
  return threatDistances
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);
}

/**
 * Batch update all NPCs in a town
 */
async function recalculateTownNPCSafety(townId: string) {
  const town = await prisma.town.findUnique({
    where: { id: townId },
    include: { npcs: true }
  });

  if (!town) return;

  const threats = await prisma.threatSource.findMany({
    where: { continentId: town.continentId, active: true }
  });

  const updates = town.npcs.map(npc => {
    const npcLocation: NPCLocation = {
      npcId: npc.id,
      townId: town.id,
      homeX: npc.homeX || town.x,
      homeY: npc.homeY || town.y,
      workX: npc.workX || town.x,
      workY: npc.workY || town.y,
      currentX: npc.currentX || town.x,
      currentY: npc.currentY || town.y,
    };

    const safety = calculateNPCSafety(npcLocation, town, threats);

    return prisma.nPC.update({
      where: { id: npc.id },
      data: { calculatedSafety: safety }
    });
  });

  await Promise.all(updates);
}
```

---

## 🌍 World Creation Flow

### Step-by-Step Process

```typescript
// /src/systems/world/world-builder.ts

interface WorldCreationConfig {
  continentId: string;
  continentName: string;

  towns: Array<{
    name: string;
    x: number;
    y: number;
    population: number;
    radius: number;
    baseSafety?: number;  // Optional, defaults to 80
  }>;

  threats: Array<{
    type: ThreatType;
    x: number;
    y: number;
    radius: number;
    severity: number;
    description?: string;
  }>;
}

/**
 * Complete world creation pipeline
 * Order matters: continent → towns → threats → NPCs → calculate safety
 */
async function createWorld(config: WorldCreationConfig): Promise<void> {
  console.log(`Creating world: ${config.continentName}`);

  // ========================================
  // STEP 1: Create Continent
  // ========================================
  const continent = await prisma.continent.create({
    data: {
      id: config.continentId,
      name: config.continentName,
      createdAt: new Date(),
    }
  });

  console.log(`✓ Created continent: ${continent.name}`);

  // ========================================
  // STEP 2: Place Towns
  // ========================================
  const createdTowns = [];

  for (const townConfig of config.towns) {
    const town = await prisma.town.create({
      data: {
        name: townConfig.name,
        continentId: continent.id,
        x: townConfig.x,
        y: townConfig.y,
        radius: townConfig.radius,
        population: townConfig.population,
        baseSafety: townConfig.baseSafety || 80,
        currentSafety: townConfig.baseSafety || 80, // Initial, will recalculate
        createdAt: new Date(),
      }
    });

    createdTowns.push(town);
    console.log(`✓ Created town: ${town.name} at (${town.x}, ${town.y})`);
  }

  // ========================================
  // STEP 3: Place Threat Sources
  // ========================================
  const createdThreats = [];

  for (const threatConfig of config.threats) {
    const threat = await prisma.threatSource.create({
      data: {
        continentId: continent.id,
        type: threatConfig.type,
        x: threatConfig.x,
        y: threatConfig.y,
        radius: threatConfig.radius,
        severity: threatConfig.severity,
        description: threatConfig.description,
        active: true,
        createdAt: new Date(),
      }
    });

    createdThreats.push(threat);
    console.log(`✓ Placed threat: ${threat.type} at (${threat.x}, ${threat.y})`);
  }

  // ========================================
  // STEP 4: Calculate Initial Town Safety
  // ========================================
  for (const town of createdTowns) {
    const townSafety = calculateTownSafety(town, createdThreats);

    await prisma.town.update({
      where: { id: town.id },
      data: { currentSafety: townSafety }
    });

    console.log(`✓ Town ${town.name} safety: ${townSafety.toFixed(1)}/100`);
  }

  // ========================================
  // STEP 5: Generate Town Populations
  // ========================================
  for (const town of createdTowns) {
    await generateTownPopulation(town, createdThreats);
    console.log(`✓ Generated ${town.population} NPCs for ${town.name}`);
  }

  // ========================================
  // STEP 6: Calculate Individual NPC Safety
  // ========================================
  await recalculateContinentSafety(continent.id);
  console.log(`✓ Calculated individual NPC safety values`);

  console.log(`\n🎉 World creation complete!`);
}

/**
 * Generate NPCs for a town with spatial distribution
 */
async function generateTownPopulation(
  town: Town,
  threats: ThreatSource[]
): Promise<void> {
  const npcs = [];

  for (let i = 0; i < town.population; i++) {
    // Distribute NPCs within town radius
    // Avoid placing homes too close to threats
    const { homeX, homeY } = generateSafeHomeLocation(town, threats);
    const { workX, workY } = generateWorkLocation(town, homeX, homeY);

    const npc = await prisma.nPC.create({
      data: {
        worldId: town.continentId,
        townId: town.id,
        name: generateNPCName(),

        // Spatial coordinates
        homeX,
        homeY,
        workX,
        workY,
        currentX: homeX,
        currentY: homeY,

        // Will be calculated in step 6
        calculatedSafety: town.currentSafety,

        // ... other NPC fields
      }
    });

    npcs.push(npc);
  }
}

/**
 * Generate home location avoiding threats
 */
function generateSafeHomeLocation(
  town: Town,
  threats: ThreatSource[]
): { homeX: number; homeY: number } {
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    // Random position within town radius
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * town.radius;

    const x = town.x + Math.cos(angle) * distance;
    const y = town.y + Math.sin(angle) * distance;

    // Check if too close to any threat
    const tooClose = threats.some(threat => {
      const dist = Math.sqrt(
        Math.pow(x - threat.x, 2) +
        Math.pow(y - threat.y, 2)
      );
      return dist < threat.radius * 0.5; // Avoid inner 50% of threat radius
    });

    if (!tooClose) {
      return { homeX: x, homeY: y };
    }

    attempts++;
  }

  // Fallback to town center if no safe spot found
  return { homeX: town.x, homeY: town.y };
}

/**
 * Generate work location near home
 */
function generateWorkLocation(
  town: Town,
  homeX: number,
  homeY: number
): { workX: number; workY: number } {
  // Work is usually within 30% of town radius from home
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * town.radius * 0.3;

  let workX = homeX + Math.cos(angle) * distance;
  let workY = homeY + Math.sin(angle) * distance;

  // Keep within town bounds
  const distFromCenter = Math.sqrt(
    Math.pow(workX - town.x, 2) +
    Math.pow(workY - town.y, 2)
  );

  if (distFromCenter > town.radius) {
    workX = town.x;
    workY = town.y;
  }

  return { workX, workY };
}
```

---

## 🗄️ Database Schema

### Schema Additions

```prisma
// /prisma/schema.prisma

model Continent {
  id          String    @id @default(cuid())
  name        String
  createdAt   DateTime  @default(now())

  towns       Town[]
  threats     ThreatSource[]
  npcs        NPC[]

  @@index([name])
}

model ThreatSource {
  id          String    @id @default(cuid())
  continentId String
  continent   Continent @relation(fields: [continentId], references: [id])

  type        String    // wolf_den, bandit_camp, monster_lair, etc.
  x           Float     // Map X coordinate
  y           Float     // Map Y coordinate
  radius      Float     // Influence radius
  severity    Float     // 0-100
  active      Boolean   @default(true)

  description String?   // "Large wolf pack, 12+ members"

  createdAt   DateTime  @default(now())
  clearedAt   DateTime? // When threat was eliminated
  clearedBy   String?   // NPC/Player who cleared it

  @@index([continentId])
  @@index([active])
  @@index([type])
}

model Town {
  id             String    @id @default(cuid())
  name           String
  continentId    String
  continent      Continent @relation(fields: [continentId], references: [id])

  // Spatial data
  x              Float     // Town center X
  y              Float     // Town center Y
  radius         Float     // Town boundary radius

  // Population
  population     Int       @default(0)

  // Safety calculations
  baseSafety     Float     @default(80)    // Base safety without threats
  currentSafety  Float     @default(80)    // Current safety with threats

  // Metadata
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Relations
  npcs           NPC[]

  @@index([continentId])
  @@index([name])
  @@index([currentSafety])
}

model NPC {
  // ... existing fields ...

  // Spatial location data
  townId           String?
  town             Town?     @relation(fields: [townId], references: [id])

  homeX            Float?    // Home location X
  homeY            Float?    // Home location Y
  workX            Float?    // Workplace X
  workY            Float?    // Workplace Y
  currentX         Float?    // Current position X
  currentY         Float?    // Current position Y

  // Calculated safety from proximity system
  calculatedSafety Float?    // 0-100, includes town + proximity

  @@index([townId])
  @@index([calculatedSafety])
}
```

---

## 🔗 Integration with Existing Systems

### Integration with Need-Based Behavior

```typescript
// /src/systems/npc/need-based-behavior.ts

/**
 * Calculate NPC safety need
 * Combines environmental safety with personal circumstances
 */
function calculateSafetyNeed(npc: NPC): number {
  // Get pre-calculated environmental safety (70% weight)
  const environmentalSafety = npc.calculatedSafety ?? 50;

  // Calculate personal safety factors (30% weight)
  const personalSafety = calculatePersonalSafety(npc);

  // Weighted combination
  const totalSafety = (environmentalSafety * 0.7) + (personalSafety * 0.3);

  // Convert to need (inverse: low safety = high need)
  return 100 - totalSafety;
}

/**
 * Personal safety factors (relationships, conflicts, health)
 */
function calculatePersonalSafety(npc: NPC): number {
  let safety = 50; // Neutral starting point

  // Positive factors
  if (npc.hasHome) safety += 10;
  if (npc.hasWeapon) safety += 5;
  if (npc.inGroup) safety += 10;

  // Negative factors
  if (npc.hasEnemies) safety -= 20;
  if (npc.health < 50) safety -= 15;
  if (npc.isWanted) safety -= 30;

  return Math.max(0, Math.min(100, safety));
}
```

### Integration with Quest Generation

```typescript
// /src/systems/npc/quest-generator.ts

/**
 * Generate safety-based quests from environmental threats
 */
async function generateSafetyQuests(npc: NPC): Promise<Quest[]> {
  const quests: Quest[] = [];

  // Only generate if safety need is high
  if (npc.calculatedSafety > 40) return quests;

  // Find nearest threats
  const town = await prisma.town.findUnique({
    where: { id: npc.townId },
    include: { continent: { include: { threats: true } } }
  });

  if (!town) return quests;

  const npcLocation: NPCLocation = {
    npcId: npc.id,
    townId: town.id,
    homeX: npc.homeX || town.x,
    homeY: npc.homeY || town.y,
    workX: npc.workX || town.x,
    workY: npc.workY || town.y,
    currentX: npc.currentX || town.x,
    currentY: npc.currentY || town.y,
  };

  const nearbyThreats = findKNearestThreats(
    npcLocation,
    town.continent.threats,
    3
  );

  for (const { threat, distance } of nearbyThreats) {
    // Generate appropriate quest based on threat type and distance
    if (threat.type === 'wolf_den' && distance < threat.radius * 0.7) {
      quests.push({
        type: 'flee',
        title: `Flee Home - Wolf Pack Nearby`,
        description: `Wolves from the den to the ${getDirection(npc, threat)} are too close. I need to move to safety!`,
        urgency: 'high',
        reward: 'survival',
        shareableWithPlayer: true,
      });
    }

    if (threat.type === 'bandit_camp') {
      quests.push({
        type: 'hire_guard',
        title: `Hire Protection from Bandits`,
        description: `Bandits are operating near my ${getThreatenedLocation(npc, threat)}. I need to hire guards or move.`,
        urgency: 'medium',
        reward: 'safety',
        shareableWithPlayer: true,
      });
    }
  }

  return quests;
}

function getDirection(npc: NPC, threat: ThreatSource): string {
  const dx = threat.x - (npc.homeX || 0);
  const dy = threat.y - (npc.homeY || 0);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  if (angle > -45 && angle <= 45) return 'east';
  if (angle > 45 && angle <= 135) return 'south';
  if (angle > 135 || angle <= -135) return 'west';
  return 'north';
}

function getThreatenedLocation(npc: NPC, threat: ThreatSource): string {
  const homeDistance = Math.sqrt(
    Math.pow((npc.homeX || 0) - threat.x, 2) +
    Math.pow((npc.homeY || 0) - threat.y, 2)
  );

  const workDistance = Math.sqrt(
    Math.pow((npc.workX || 0) - threat.x, 2) +
    Math.pow((npc.workY || 0) - threat.y, 2)
  );

  return homeDistance < workDistance ? 'home' : 'workplace';
}
```

### Integration with Event Narration

```typescript
// /src/systems/narrative/event-narrator.ts

/**
 * Narrate threat-based events with spatial context
 */
async function narrateThreatEvent(
  event: GameEvent,
  playerLocation: { x: number; y: number }
): Promise<string> {
  if (event.type === 'threat_spawned') {
    const threat = event.data as ThreatSource;
    const distance = calculateDistance(playerLocation, threat);

    if (distance < threat.radius) {
      return `🐺 A ${threat.type.replace('_', ' ')} has appeared nearby to the ${getDirection(playerLocation, threat)}! The town is on alert.`;
    } else if (distance < threat.radius * 3) {
      return `⚠️ Scouts report a ${threat.type.replace('_', ' ')} has been spotted in the region. Stay vigilant.`;
    } else {
      return null; // Too far away, don't show
    }
  }

  if (event.type === 'threat_cleared') {
    const threat = event.data as ThreatSource;
    return `✓ Great news! The ${threat.type.replace('_', ' ')} at ${threat.description} has been eliminated. The area is safer now.`;
  }

  return null;
}
```

---

## ⚡ Performance Considerations

### Calculation Frequency

```typescript
// When to recalculate safety values

// TOWN SAFETY - Recalculate when:
// 1. New threat is added/spawned
// 2. Threat is cleared/deactivated
// 3. Threat severity changes (rare)
// Frequency: On-demand only

async function onThreatChange(continentId: string) {
  await recalculateContinentSafety(continentId);
}

// NPC SAFETY - Recalculate when:
// 1. NPC moves to new location (home/work change)
// 2. Town safety changes (propagate down)
// 3. Daily/hourly tick (optional, for moving NPCs)
// Frequency: On location change + daily tick

async function onNPCMove(npcId: string) {
  const npc = await prisma.nPC.findUnique({
    where: { id: npcId },
    include: { town: true }
  });

  if (!npc?.town) return;

  const threats = await prisma.threatSource.findMany({
    where: { continentId: npc.town.continentId, active: true }
  });

  const npcLocation: NPCLocation = {
    npcId: npc.id,
    townId: npc.town.id,
    homeX: npc.homeX || npc.town.x,
    homeY: npc.homeY || npc.town.y,
    workX: npc.workX || npc.town.x,
    workY: npc.workY || npc.town.y,
    currentX: npc.currentX || npc.town.x,
    currentY: npc.currentY || npc.town.y,
  };

  const newSafety = calculateNPCSafety(npcLocation, npc.town, threats);

  await prisma.nPC.update({
    where: { id: npcId },
    data: { calculatedSafety: newSafety }
  });
}
```

### Optimization: Spatial Indexing

```typescript
// For large worlds, use spatial indexing to limit threat checks

interface SpatialGrid {
  cellSize: number;
  cells: Map<string, ThreatSource[]>;
}

function createSpatialIndex(
  threats: ThreatSource[],
  cellSize: number = 100
): SpatialGrid {
  const grid: SpatialGrid = {
    cellSize,
    cells: new Map()
  };

  for (const threat of threats) {
    const cellX = Math.floor(threat.x / cellSize);
    const cellY = Math.floor(threat.y / cellSize);
    const key = `${cellX},${cellY}`;

    if (!grid.cells.has(key)) {
      grid.cells.set(key, []);
    }

    grid.cells.get(key)!.push(threat);
  }

  return grid;
}

function getNearbyThreats(
  location: { x: number; y: number },
  grid: SpatialGrid
): ThreatSource[] {
  const cellX = Math.floor(location.x / grid.cellSize);
  const cellY = Math.floor(location.y / grid.cellSize);

  const nearby: ThreatSource[] = [];

  // Check 3x3 grid around location
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${cellX + dx},${cellY + dy}`;
      const threats = grid.cells.get(key);
      if (threats) {
        nearby.push(...threats);
      }
    }
  }

  return nearby;
}
```

---

## 📈 Example: Complete World Setup

```typescript
// Example world configuration

const exampleWorld: WorldCreationConfig = {
  continentId: 'continent_1',
  continentName: 'Northern Frontier',

  towns: [
    {
      name: 'Ironhaven',
      x: 500,
      y: 500,
      population: 150,
      radius: 50,
      baseSafety: 85,  // Well-defended town
    },
    {
      name: 'Millbrook',
      x: 800,
      y: 300,
      population: 80,
      radius: 30,
      baseSafety: 70,  // Smaller, less safe
    },
    {
      name: 'Wolfridge',
      x: 200,
      y: 700,
      population: 60,
      radius: 25,
      baseSafety: 60,  // Frontier town
    }
  ],

  threats: [
    {
      type: 'wolf_den',
      x: 450,
      y: 600,
      radius: 80,
      severity: 60,
      description: 'Large wolf pack, 15+ members',
    },
    {
      type: 'bandit_camp',
      x: 750,
      y: 250,
      radius: 60,
      severity: 75,
      description: 'Organized bandit gang, armed',
    },
    {
      type: 'haunted_ruins',
      x: 150,
      y: 650,
      radius: 50,
      severity: 40,
      description: 'Ancient ruins, undead sightings',
    }
  ]
};

// Create the world
await createWorld(exampleWorld);

// Expected results:
// - Ironhaven: currentSafety ≈ 60 (wolf den nearby reduces from 85)
// - Millbrook: currentSafety ≈ 40 (bandit camp very close reduces from 70)
// - Wolfridge: currentSafety ≈ 30 (both wolf den and ruins nearby reduce from 60)

// Individual NPCs in Ironhaven:
// - NPCs living on south side (toward wolves): safety ≈ 45-55
// - NPCs living on north side (away from wolves): safety ≈ 65-75
// - NPCs in town center: safety ≈ 60 (town average)
```

---

## 🎮 Gameplay Impact

### Emergent Behaviors

**1. Migration Patterns**
```typescript
// NPCs in Wolfridge (safety: 30) may want to move to Ironhaven (safety: 60)
if (npc.calculatedSafety < 40 && npc.wealthNeed < 60) {
  generateQuest({
    type: 'migrate',
    title: 'Move to Safer Town',
    description: `Wolfridge is too dangerous with the wolves and undead. I should move to Ironhaven.`,
    destination: 'Ironhaven'
  });
}
```

**2. Defense Initiatives**
```typescript
// Towns with low safety may organize threat clearing
if (town.currentSafety < 50) {
  const nearestThreat = findNearestThreat(town);

  generateCommunityQuest({
    type: 'clear_threat',
    title: `Eliminate ${nearestThreat.type}`,
    description: `The ${nearestThreat.type} is threatening ${town.name}. We need brave adventurers to clear it out!`,
    reward: increaseTownSafety(20),
    participants: 3-5,
  });
}
```

**3. Property Values**
```typescript
// Houses on dangerous side of town are cheaper
function calculateHouseValue(house: House, town: Town): number {
  const baseValue = 1000;

  // Location safety affects value
  const locationSafety = calculateLocationSafety(house.x, house.y, town);
  const safetyModifier = locationSafety / 100; // 0.0 to 1.0

  return baseValue * safetyModifier;
}

// Example:
// House on safe north side: 1000 * 0.75 = 750 gold
// House on dangerous south side: 1000 * 0.45 = 450 gold
```

---

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (VM-035)
- Add Continent, ThreatSource, Town models to database
- Implement town safety calculation function
- Add spatial coordinates to NPC model
- Migration script for existing data

### Phase 2: World Builder (VM-036)
- Implement world creation pipeline
- Town population generation with spatial distribution
- Safe home location algorithm
- Initial safety calculations

### Phase 3: NPC Proximity System (VM-037)
- Implement K-nearest threats algorithm
- Individual NPC safety calculation
- Integration with need-based behavior system
- Performance optimization with spatial indexing

### Phase 4: Dynamic Updates (VM-038)
- Threat spawn/clear mechanics
- Recalculation triggers
- Town and NPC safety updates
- Event system integration

### Phase 5: Gameplay Integration (VM-039)
- Quest generation from threats
- Migration system
- Community defense quests
- Property value adjustments
- Narrative integration

---

## 📚 References

**Related Systems:**
- `NEED_BASED_BEHAVIOR_SESSION.md` - NPC needs and decision-making
- `LIVING_WORLD_POPULATION_AND_INFORMATION_SYSTEMS.md` - World structure
- `NPC_DATABASE_OPTIMIZATION.md` - Performance considerations
- `HIERARCHICAL_SPATIAL_SAFETY_SYSTEM.md` - This document

**Implementation Files:**
- `/src/systems/world/town-safety-system.ts` - Town-level calculations
- `/src/systems/world/npc-proximity-safety.ts` - Individual NPC calculations
- `/src/systems/world/world-builder.ts` - World creation pipeline
- `/prisma/schema.prisma` - Database models

**Key Benefits:**
1. **Performance**: O(towns × threats) instead of O(NPCs × threats)
2. **Scalability**: Works with 10 or 10,000 NPCs
3. **Intuitive**: Matches how world is created (top-down)
4. **Dynamic**: Easy to add/remove threats and see impact
5. **Spatial**: Creates realistic geography-based danger zones
