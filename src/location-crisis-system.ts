// Location-based crisis trigger system

export interface CrisisZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  crisisType: 'danger' | 'plague' | 'bandit' | 'disaster' | 'haunted';
  triggerOnce: boolean; // Only trigger the first time player enters
  triggered: boolean;
  description: string;
  effectRadius: number; // How far the crisis affects NPCs
}

export interface LocationCrisisEvent {
  type: string;
  message: string;
  npcEffects?: {
    needSafety?: number;
    needFood?: number;
    emotionHappiness?: number;
    emotionFear?: number;
  };
}

// Predefined crisis zones
export const CRISIS_ZONES: CrisisZone[] = [
  {
    id: 'bandit_camp',
    name: 'Bandit Camp',
    x: 200,
    y: 200,
    width: 100,
    height: 100,
    crisisType: 'bandit',
    triggerOnce: false,
    triggered: false,
    description: 'A dangerous area controlled by bandits',
    effectRadius: 150
  },
  {
    id: 'plague_house',
    name: 'Plague House',
    x: 1400, // Moved 200px right
    y: 300,
    width: 80,
    height: 80,
    crisisType: 'plague',
    triggerOnce: true,
    triggered: false,
    description: 'An abandoned house struck by plague',
    effectRadius: 200
  },
  {
    id: 'haunted_grove',
    name: 'Haunted Grove',
    x: 800,
    y: 800,
    width: 150,
    height: 150,
    crisisType: 'haunted',
    triggerOnce: false,
    triggered: false,
    description: 'A cursed grove that fills visitors with dread',
    effectRadius: 100
  },
  {
    id: 'collapsed_mine',
    name: 'Collapsed Mine',
    x: 400,
    y: 700,
    width: 120,
    height: 80,
    crisisType: 'disaster',
    triggerOnce: true,
    triggered: false,
    description: 'A mine that collapsed, trapping workers',
    effectRadius: 250
  },
  {
    id: 'wolf_den',
    name: 'Wolf Den',
    x: 1300, // Moved 100px right (1200→1300)
    y: 100,
    width: 100,
    height: 100,
    crisisType: 'danger',
    triggerOnce: false,
    triggered: false,
    description: 'A den of hungry wolves',
    effectRadius: 150
  }
];

export class LocationCrisisSystem {
  private triggeredZones: Set<string> = new Set();
  
  // Check if player is in any crisis zone
  checkPlayerInCrisisZone(playerX: number, playerY: number): LocationCrisisEvent | null {
    for (const zone of CRISIS_ZONES) {
      if (this.isPointInZone(playerX, playerY, zone)) {
        // Check if this is a one-time trigger that's already been triggered
        if (zone.triggerOnce && this.triggeredZones.has(zone.id)) {
          continue;
        }
        
        // Mark as triggered
        this.triggeredZones.add(zone.id);
        
        // Return crisis event based on type
        return this.generateCrisisEvent(zone);
      }
    }
    
    return null;
  }
  
  // Check if a point is inside a zone
  private isPointInZone(x: number, y: number, zone: CrisisZone): boolean {
    return x >= zone.x && 
           x <= zone.x + zone.width && 
           y >= zone.y && 
           y <= zone.y + zone.height;
  }
  
  // Get NPCs affected by a crisis zone
  getNPCsInCrisisRadius(zone: CrisisZone, npcs: any[]): any[] {
    const affected = [];
    const centerX = zone.x + zone.width / 2;
    const centerY = zone.y + zone.height / 2;
    
    for (const npc of npcs) {
      if (npc.sprite) {
        const distance = Math.sqrt(
          Math.pow(npc.sprite.x - centerX, 2) + 
          Math.pow(npc.sprite.y - centerY, 2)
        );
        
        if (distance <= zone.effectRadius) {
          affected.push(npc);
        }
      }
    }
    
    return affected;
  }
  
  // Generate crisis event based on zone type
  private generateCrisisEvent(zone: CrisisZone): LocationCrisisEvent {
    switch (zone.crisisType) {
      case 'bandit':
        return {
          type: 'bandit',
          message: '⚔️ You\'ve entered bandit territory! The locals are terrified!',
          npcEffects: {
            needSafety: -30,
            emotionFear: 20,
            emotionHappiness: -15
          }
        };
        
      case 'plague':
        return {
          type: 'plague', 
          message: '☠️ You\'ve discovered a plague-stricken area! Disease spreads fear!',
          npcEffects: {
            needSafety: -20,
            needFood: -15,
            emotionFear: 30,
            emotionHappiness: -25
          }
        };
        
      case 'haunted':
        return {
          type: 'haunted',
          message: '👻 An unnatural chill fills the air... This place is cursed!',
          npcEffects: {
            emotionFear: 40,
            emotionHappiness: -30,
            needSafety: -15
          }
        };
        
      case 'disaster':
        return {
          type: 'disaster',
          message: '💥 You\'ve found the collapsed mine! Survivors need help!',
          npcEffects: {
            needSafety: -25,
            emotionFear: 25,
            emotionHappiness: -20,
            needFood: -10
          }
        };
        
      case 'danger':
        return {
          type: 'danger',
          message: '🐺 You hear howling... You\'ve entered dangerous territory!',
          npcEffects: {
            needSafety: -35,
            emotionFear: 35,
            emotionHappiness: -10
          }
        };
        
      default:
        return {
          type: 'unknown',
          message: '⚠️ Something feels wrong about this place...'
        };
    }
  }
  
  // Apply crisis effects to NPCs
  applyCrisisEffectsToNPCs(zone: CrisisZone, event: LocationCrisisEvent, npcs: any[]): string[] {
    const affectedNPCs = this.getNPCsInCrisisRadius(zone, npcs);
    const effects: string[] = [];
    
    if (event.npcEffects) {
      for (const npc of affectedNPCs) {
        const npcEffects: string[] = [];
        
        // Apply need changes
        if (event.npcEffects.needSafety !== undefined) {
          npc.needSafety = Math.max(0, Math.min(100, npc.needSafety + event.npcEffects.needSafety));
          npcEffects.push(`Safety ${event.npcEffects.needSafety > 0 ? '+' : ''}${event.npcEffects.needSafety}`);
        }
        if (event.npcEffects.needFood !== undefined) {
          npc.needFood = Math.max(0, Math.min(100, npc.needFood + event.npcEffects.needFood));
          npcEffects.push(`Food ${event.npcEffects.needFood > 0 ? '+' : ''}${event.npcEffects.needFood}`);
        }
        
        // Apply emotion changes
        if (event.npcEffects.emotionHappiness !== undefined) {
          npc.emotionHappiness = Math.max(0, Math.min(100, npc.emotionHappiness + event.npcEffects.emotionHappiness));
          npcEffects.push(`Happy ${event.npcEffects.emotionHappiness > 0 ? '+' : ''}${event.npcEffects.emotionHappiness}`);
        }
        if (event.npcEffects.emotionFear !== undefined) {
          npc.emotionFear = Math.max(0, Math.min(100, npc.emotionFear + event.npcEffects.emotionFear));
          npcEffects.push(`Fear ${event.npcEffects.emotionFear > 0 ? '+' : ''}${event.npcEffects.emotionFear}`);
        }
        
        console.log(`Crisis at ${zone.name} affected ${npc.name}: ${npcEffects.join(', ')}`);
        effects.push(`${npc.name}:${npcEffects.join('|')}`);
      }
    }
    
    return effects;
  }
  
  // Reset all triggered zones (for testing)
  resetTriggeredZones(): void {
    this.triggeredZones.clear();
  }
  
  // Get visual representation of zones for rendering
  getZoneVisuals(): Array<{zone: CrisisZone, color: number, alpha: number}> {
    const visuals = [];
    
    for (const zone of CRISIS_ZONES) {
      let color = 0xff0000; // Default red
      let alpha = 0.3;
      
      switch (zone.crisisType) {
        case 'bandit':
          color = 0x8b0000; // Dark red
          break;
        case 'plague':
          color = 0x556b2f; // Dark olive green
          break;
        case 'haunted':
          color = 0x483d8b; // Dark slate blue
          break;
        case 'disaster':
          color = 0xff8c00; // Dark orange
          break;
        case 'danger':
          color = 0x8b4513; // Saddle brown
          break;
      }
      
      // Make triggered one-time zones more transparent
      if (zone.triggerOnce && this.triggeredZones.has(zone.id)) {
        alpha = 0.1;
      }
      
      visuals.push({ zone, color, alpha });
    }
    
    return visuals;
  }
  
  // Check if a zone is currently active (player is inside)
  isPlayerInZone(playerX: number, playerY: number, zoneId: string): boolean {
    const zone = CRISIS_ZONES.find(z => z.id === zoneId);
    return zone ? this.isPointInZone(playerX, playerY, zone) : false;
  }
}