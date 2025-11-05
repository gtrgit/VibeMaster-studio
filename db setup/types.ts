// Type definitions for VibeMaster Simulation
// These match the Prisma schema and add runtime types

export interface TimeState {
  day: number;
  hour: number;
}

export interface Needs {
  food: number;      // 0-100
  safety: number;
  wealth: number;
  social: number;
  purpose: number;
}

export interface Emotions {
  happiness: number;
  anger: number;
  fear: number;
  sadness: number;
  trust: number;
  anticipation: number;
  // Derived
  love?: number;
  desperation?: number;
  grief?: number;
}

export interface Personality {
  traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  values: string[];
  fears: string[];
  speechPattern: {
    formality: number;
    verbosity: number;
    emotionalExpression: number;
    dialect?: string;
    quirks: string[];
  };
}

export type GoalType = 
  | "survival"
  | "rescue"
  | "revenge"
  | "romance"
  | "wealth"
  | "power"
  | "knowledge"
  | "escape";

export interface Goal {
  id: string;
  type: GoalType;
  target?: string;
  priority: number;
  urgent: boolean;
  desperate: boolean;
  deadline?: number;
  completed: boolean;
  failed: boolean;
  plan: Action[];
  obstacles: string[];
}

export interface Action {
  type: string;
  target?: string;
  location?: string;
  duration?: number; // hours
}

export interface MemoryEntry {
  day: number;
  event: string;
  emotion: string;
  emotionalImpact: number;
  involvedNpcs: string[];
}

export interface RelationshipData {
  value: number;
  trust: number;
  affection: number;
  respect: number;
  grudge: number;
  fear: number;
}

export type EventType = 
  | "conversation"
  | "theft"
  | "assault"
  | "murder"
  | "kidnapping"
  | "discovery"
  | "betrayal"
  | "romance"
  | "trade"
  | "help"
  | "conflict";

export interface SimulationEvent {
  day: number;
  hour: number;
  type: EventType;
  description: string;
  locationId: string;
  participantIds: string[];
  targetId?: string;
  consequences: Consequence[];
  dramaticValue: number;
}

export interface Consequence {
  type: "relationship" | "need" | "emotion" | "goal" | "state" | "reputation";
  npcId: string;
  field: string;
  value: number | string;
  delayed?: number; // Apply after N days
}

export interface NPCState {
  id: string;
  name: string;
  age: number;
  occupation: string;
  state: "alive" | "injured" | "kidnapped" | "dead";
  locationId: string;
  
  personality: Personality;
  needs: Needs;
  emotions: Emotions;
  goals: Goal[];
  relationships: Map<string, RelationshipData>;
  memories: MemoryEntry[];
}

export interface LocationData {
  id: string;
  name: string;
  description: string;
  type: string;
  hasFood: boolean;
  hasShelter: boolean;
  isPublic: boolean;
  isDangerous: boolean;
  dangerLevel: number;
}

export interface FactionData {
  id: string;
  name: string;
  type: string;
  memberIds: string[];
  leaderIds: string[];
  wealth: number;
  power: number;
  influence: number;
  relationships: Map<string, number>;
  goals: Goal[];
}

export interface WorldStateData {
  time: TimeState;
  npcs: Map<string, NPCState>;
  locations: Map<string, LocationData>;
  events: SimulationEvent[];
  factions: Map<string, FactionData>;
}

export interface SimulationConfig {
  tickSpeed: number;        // milliseconds per tick
  autoSaveInterval: number; // save every N ticks
  enableLogging: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

export interface NarrativeContext {
  character: {
    name: string;
    role: string;
    personality: Personality;
    currentEmotion: string;
    emotionIntensity: number;
    urgentNeed?: string;
    topGoal?: Goal;
    recentMemories: MemoryEntry[];
  };
  relationship: {
    withPlayer: number;
    trustLevel: TrustLevel;
    history: InteractionHistory[];
    lastInteraction?: InteractionHistory;
  };
  situation: {
    crisis?: Crisis;
    timeUrgency?: number;
    availableHelp: string[];
    obstacles: Obstacle[];
    stakes: Stakes;
  };
  narrativeOpportunity: {
    type: NarrativeType;
    emotionalPeak: boolean;
    questOpportunity: boolean;
    consequencesHigh: boolean;
    dramaticValue: number;
  };
}

export type TrustLevel = "hostile" | "wary" | "neutral" | "friendly" | "trusted" | "beloved";

export interface InteractionHistory {
  day: number;
  type: string;
  outcome: string;
  emotionalImpact: number;
}

export interface Crisis {
  type: CrisisType;
  urgency: "low" | "medium" | "high" | "extreme";
  victim?: string;
  perpetrator?: string;
  timeLimit?: number;
  consequenceIfFail: string;
  playerCanHelp: boolean;
}

export type CrisisType = 
  | "kidnapping"
  | "murder"
  | "betrayal"
  | "siege"
  | "plague"
  | "starvation"
  | "bankruptcy";

export interface Obstacle {
  type: "resource" | "physical" | "social" | "environmental";
  description: string;
  severity: number;
}

export interface Stakes {
  personal: number;
  social: number;
  material: number;
  moral: number;
}

export type NarrativeType =
  | "desperate_plea"
  | "betrayal_confrontation"
  | "romance_confession"
  | "secret_revelation"
  | "moral_dilemma"
  | "redemption_moment"
  | "tragic_news"
  | "triumph"
  | "ambient";
