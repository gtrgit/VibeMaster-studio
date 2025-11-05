# 🛠️ VIBEMASTER NARRATIVE IMPLEMENTATION GUIDE
**Practical Code for Living World → AI Narrative Integration**

**Version:** 1.0  
**Date:** November 1, 2025  
**Purpose:** Working TypeScript implementation patterns

---

## 📦 TYPE DEFINITIONS

### Core Data Structures

```typescript
// ============================================================================
// SIMULATION TYPES
// ============================================================================

interface WorldState {
  time: TimeState;
  npcs: Record<string, NPC>;
  locations: Record<string, Location>;
  events: Event[];
  factions: Record<string, Faction>;
  economy: EconomyState;
  player: PlayerState;
}

interface NPC {
  id: string;
  name: string;
  role: string;
  personality: Personality;
  needs: Needs;
  emotions: Emotions;
  goals: Goal[];
  relationships: Record<string, number>; // npcId -> relationship value
  memory: MemoryEntry[];
  location: string;
  state: NPCState;
}

interface Personality {
  traits: {
    openness: number;      // 0-100
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  values: string[];        // ["honesty", "family", "wealth"]
  fears: string[];         // ["death", "poverty", "abandonment"]
  speechPattern: SpeechPattern;
}

interface SpeechPattern {
  formality: number;       // 0-100 (0=casual, 100=formal)
  verbosity: number;       // 0-100 (0=terse, 100=verbose)
  emotionalExpression: number; // 0-100
  dialect?: string;        // "cockney", "southern", etc.
  quirks: string[];        // ["uses nautical metaphors", "repeats last word"]
}

interface Needs {
  food: number;           // 0-100
  safety: number;
  wealth: number;
  social: number;
  purpose: number;
}

interface Emotions {
  happiness: number;      // 0-100
  anger: number;
  fear: number;
  sadness: number;
  disgust: number;
  surprise: number;
  trust: number;
  anticipation: number;
  // Derived emotions
  love?: number;          // happiness + trust
  desperation?: number;   // fear + sadness + low needs
  grief?: number;         // sadness + low social
}

interface Goal {
  id: string;
  type: GoalType;
  target?: string;        // NPC or location or item ID
  priority: number;       // 0-100
  urgent: boolean;
  desperate: boolean;
  plan: Action[];
  obstacles: string[];
  deadline?: number;      // day number
}

type GoalType = 
  | "survival"
  | "rescue"
  | "revenge"
  | "romance"
  | "wealth"
  | "power"
  | "knowledge"
  | "escape";

interface MemoryEntry {
  day: number;
  event: string;
  emotion: string;
  impact: number;         // How significant (0-100)
  involves: string[];     // NPCids
}

// ============================================================================
// NARRATIVE TYPES
// ============================================================================

interface DialogueContext {
  character: CharacterContext;
  relationship: RelationshipContext;
  situation: SituationContext;
  narrativeOpportunity: NarrativeOpportunity;
}

interface CharacterContext {
  name: string;
  role: string;
  personality: Personality;
  currentEmotion: string;
  emotionIntensity: number;
  urgentNeed?: string;
  topGoal?: Goal;
  recentMemories: MemoryEntry[];
}

interface RelationshipContext {
  withPlayer: number;
  trustLevel: TrustLevel;
  history: InteractionHistory[];
  lastInteraction?: InteractionHistory;
}

type TrustLevel = "hostile" | "wary" | "neutral" | "friendly" | "trusted" | "beloved";

interface InteractionHistory {
  day: number;
  type: string;
  outcome: string;
  emotionalImpact: number;
}

interface SituationContext {
  crisis?: Crisis;
  timeUrgency?: number;      // 0-100
  availableHelp: string[];   // NPC ids who could help
  obstacles: Obstacle[];
  stakes: Stakes;
}

interface Crisis {
  type: CrisisType;
  urgency: "low" | "medium" | "high" | "extreme";
  victim?: string;
  perpetrator?: string;
  timeLimit?: number;
  consequenceIfFail: string;
  playerCanHelp: boolean;
}

type CrisisType = 
  | "kidnapping"
  | "murder"
  | "betrayal"
  | "siege"
  | "plague"
  | "starvation"
  | "bankruptcy";

interface NarrativeOpportunity {
  type: NarrativeType;
  emotionalPeak: boolean;
  questOpportunity: boolean;
  consequencesHigh: boolean;
  dramaticValue: number;     // 0-100
}

type NarrativeType =
  | "desperate_plea"
  | "betrayal_confrontation"
  | "romance_confession"
  | "secret_revelation"
  | "moral_dilemma"
  | "redemption_moment"
  | "tragic_news"
  | "triumph"
  | "ambient";

// ============================================================================
// PROMPT TYPES
// ============================================================================

interface PromptConfig {
  template: PromptTemplate;
  context: DialogueContext;
  worldRules: WorldRules;
  formatRequirements: FormatRequirements;
  characterVoice: CharacterVoiceGuide;
}

interface WorldRules {
  hard: string[];           // Cannot be broken
  soft: string[];           // Can bend for story
  established: string[];    // What exists in this world
}

interface FormatRequirements {
  outputFormat: "ink" | "json" | "yaml";
  variablesToTrack: string[];
  requiredBranches: number;
  maxLength?: number;
  minChoices: number;
}

interface CharacterVoiceGuide {
  speakingStyle: string[];
  neverSays: string[];
  catchphrases: string[];
  examples: string[];
}

// ============================================================================
// INK TYPES
// ============================================================================

interface InkScript {
  raw: string;
  variables: InkVariable[];
  knots: InkKnot[];
  hasErrors: boolean;
  errors?: string[];
}

interface InkVariable {
  name: string;
  initialValue: any;
  type: "number" | "boolean" | "string";
}

interface InkKnot {
  name: string;
  type: "conversation" | "choice_point" | "consequence";
}

// ============================================================================
// RESULT TYPES
// ============================================================================

interface DialogueResult {
  success: boolean;
  choiceMade: string;
  variableChanges: Record<string, any>;
  consequences: Consequence[];
  newQuests: Quest[];
  relationshipChanges: Record<string, number>;
}

interface Consequence {
  type: string;
  target: string;
  effect: string;
  value: number;
  delayed?: number;        // Days until effect
}
```

---

## 🏗️ CORE CLASSES

### 1. Context Builder

```typescript
class NarrativeContextBuilder {
  
  constructor(private worldState: WorldState) {}
  
  /**
   * Build dialogue context for an NPC
   */
  buildDialogueContext(npcId: string): DialogueContext {
    const npc = this.worldState.npcs[npcId];
    
    return {
      character: this.buildCharacterContext(npc),
      relationship: this.buildRelationshipContext(npc),
      situation: this.buildSituationContext(npc),
      narrativeOpportunity: this.detectNarrativeOpportunity(npc)
    };
  }
  
  /**
   * Extract character state
   */
  private buildCharacterContext(npc: NPC): CharacterContext {
    const primaryEmotion = this.getPrimaryEmotion(npc.emotions);
    const emotionIntensity = npc.emotions[primaryEmotion];
    
    return {
      name: npc.name,
      role: npc.role,
      personality: npc.personality,
      currentEmotion: primaryEmotion,
      emotionIntensity,
      urgentNeed: this.getUrgentNeed(npc.needs),
      topGoal: npc.goals[0],
      recentMemories: this.getRecentMemories(npc, 5)
    };
  }
  
  /**
   * Get strongest emotion
   */
  private getPrimaryEmotion(emotions: Emotions): string {
    return Object.entries(emotions)
      .filter(([key]) => !['love', 'desperation', 'grief'].includes(key)) // Skip derived
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  
  /**
   * Get most urgent need
   */
  private getUrgentNeed(needs: Needs): string | undefined {
    const criticalNeeds = Object.entries(needs)
      .filter(([_, value]) => value < 30);
    
    if (criticalNeeds.length === 0) return undefined;
    
    return criticalNeeds.sort((a, b) => a[1] - b[1])[0][0];
  }
  
  /**
   * Get recent memories
   */
  private getRecentMemories(npc: NPC, count: number): MemoryEntry[] {
    return npc.memory
      .sort((a, b) => b.day - a.day)
      .slice(0, count);
  }
  
  /**
   * Build relationship context
   */
  private buildRelationshipContext(npc: NPC): RelationshipContext {
    const relationship = npc.relationships['player'] || 0;
    
    return {
      withPlayer: relationship,
      trustLevel: this.calculateTrustLevel(relationship),
      history: this.getInteractionHistory(npc),
      lastInteraction: this.getLastInteraction(npc)
    };
  }
  
  /**
   * Calculate trust level from relationship value
   */
  private calculateTrustLevel(value: number): TrustLevel {
    if (value < -50) return "hostile";
    if (value < -20) return "wary";
    if (value < 20) return "neutral";
    if (value < 50) return "friendly";
    if (value < 80) return "trusted";
    return "beloved";
  }
  
  /**
   * Get interaction history
   */
  private getInteractionHistory(npc: NPC): InteractionHistory[] {
    return npc.memory
      .filter(m => m.involves.includes('player'))
      .map(m => ({
        day: m.day,
        type: m.event,
        outcome: this.interpretOutcome(m),
        emotionalImpact: m.impact
      }));
  }
  
  /**
   * Get last player interaction
   */
  private getLastInteraction(npc: NPC): InteractionHistory | undefined {
    const history = this.getInteractionHistory(npc);
    return history.length > 0 ? history[0] : undefined;
  }
  
  /**
   * Build situation context
   */
  private buildSituationContext(npc: NPC): SituationContext {
    const crisis = this.identifyCrisis(npc);
    
    return {
      crisis,
      timeUrgency: this.calculateUrgency(npc.goals[0]),
      availableHelp: this.identifyAvailableHelp(npc),
      obstacles: this.identifyObstacles(npc),
      stakes: this.calculateStakes(npc, crisis)
    };
  }
  
  /**
   * Identify if NPC is in crisis
   */
  private identifyCrisis(npc: NPC): Crisis | undefined {
    const goal = npc.goals[0];
    
    // Check for kidnapping
    if (goal?.type === "rescue") {
      const victim = this.worldState.npcs[goal.target];
      if (victim?.state === "kidnapped") {
        return {
          type: "kidnapping",
          urgency: this.calculateCrisisUrgency(goal),
          victim: victim.id,
          timeLimit: goal.deadline,
          consequenceIfFail: "victim_death",
          playerCanHelp: true
        };
      }
    }
    
    // Check for starvation
    if (npc.needs.food < 20) {
      return {
        type: "starvation",
        urgency: npc.needs.food < 10 ? "extreme" : "high",
        consequenceIfFail: "npc_death",
        playerCanHelp: true
      };
    }
    
    // Add more crisis types...
    
    return undefined;
  }
  
  /**
   * Calculate urgency (0-100)
   */
  private calculateUrgency(goal?: Goal): number {
    if (!goal) return 0;
    
    let urgency = goal.priority;
    
    if (goal.urgent) urgency += 20;
    if (goal.desperate) urgency += 30;
    
    if (goal.deadline) {
      const daysLeft = goal.deadline - this.worldState.time.day;
      if (daysLeft < 2) urgency += 30;
      else if (daysLeft < 5) urgency += 20;
      else if (daysLeft < 10) urgency += 10;
    }
    
    return Math.min(100, urgency);
  }
  
  /**
   * Identify who can help NPC
   */
  private identifyAvailableHelp(npc: NPC): string[] {
    const helpers: string[] = [];
    
    // Check other NPCs
    for (const [id, otherNpc] of Object.entries(this.worldState.npcs)) {
      if (id === npc.id) continue;
      
      // Check relationship
      if (npc.relationships[id] > 40) {
        // Check if they're capable
        if (this.canHelp(otherNpc, npc.goals[0])) {
          helpers.push(id);
        }
      }
    }
    
    // Player is always potential help
    helpers.push('player');
    
    return helpers;
  }
  
  /**
   * Check if NPC can help with goal
   */
  private canHelp(helper: NPC, goal: Goal): boolean {
    // Implement based on goal type and NPC capabilities
    // This is simplified
    return helper.needs.safety > 50; // Won't help if in danger themselves
  }
  
  /**
   * Identify obstacles to goal
   */
  private identifyObstacles(npc: NPC): Obstacle[] {
    const goal = npc.goals[0];
    if (!goal) return [];
    
    const obstacles: Obstacle[] = [];
    
    // Low resources
    if (npc.needs.wealth < 20 && goal.type === "rescue") {
      obstacles.push({
        type: "resource",
        description: "lacks funds for equipment",
        severity: 60
      });
    }
    
    // Physical limitation
    if (npc.state === "injured") {
      obstacles.push({
        type: "physical",
        description: "injured and unable to travel",
        severity: 80
      });
    }
    
    // Social obstacles
    if (goal.obstacles) {
      goal.obstacles.forEach(obs => {
        obstacles.push({
          type: "social",
          description: obs,
          severity: 50
        });
      });
    }
    
    return obstacles;
  }
  
  /**
   * Calculate what's at stake
   */
  private calculateStakes(npc: NPC, crisis?: Crisis): Stakes {
    if (!crisis) {
      return {
        personal: 20,
        social: 10,
        material: 10,
        moral: 5
      };
    }
    
    return {
      personal: crisis.type === "kidnapping" ? 100 : 50,
      social: 60,
      material: 40,
      moral: crisis.type === "betrayal" ? 80 : 30
    };
  }
  
  /**
   * Detect narrative opportunity
   */
  private detectNarrativeOpportunity(npc: NPC): NarrativeOpportunity {
    // Desperate plea
    if (npc.emotions.desperation > 80 && 
        npc.goals[0]?.priority > 90 &&
        npc.relationships['player'] > 30) {
      return {
        type: "desperate_plea",
        emotionalPeak: true,
        questOpportunity: true,
        consequencesHigh: true,
        dramaticValue: 95
      };
    }
    
    // Betrayal confrontation
    if (npc.emotions.anger > 80 &&
        npc.memory.some(m => m.event === "player_broke_promise")) {
      return {
        type: "betrayal_confrontation",
        emotionalPeak: true,
        questOpportunity: false,
        consequencesHigh: true,
        dramaticValue: 90
      };
    }
    
    // Romance
    if (npc.emotions.love > 70 &&
        npc.relationships['player'] > 60) {
      return {
        type: "romance_confession",
        emotionalPeak: true,
        questOpportunity: false,
        consequencesHigh: true,
        dramaticValue: 85
      };
    }
    
    // Default ambient
    return {
      type: "ambient",
      emotionalPeak: false,
      questOpportunity: false,
      consequencesHigh: false,
      dramaticValue: 30
    };
  }
  
  private interpretOutcome(memory: MemoryEntry): string {
    // Simplified
    if (memory.impact > 30) return "positive";
    if (memory.impact < -30) return "negative";
    return "neutral";
  }
  
  private calculateCrisisUrgency(goal: Goal): Crisis["urgency"] {
    const urgency = this.calculateUrgency(goal);
    if (urgency > 90) return "extreme";
    if (urgency > 70) return "high";
    if (urgency > 40) return "medium";
    return "low";
  }
}

interface Obstacle {
  type: "resource" | "physical" | "social" | "environmental";
  description: string;
  severity: number;
}

interface Stakes {
  personal: number;
  social: number;
  material: number;
  moral: number;
}
```

### 2. Prompt Builder

```typescript
class ClaudePromptBuilder {
  
  private worldRules: WorldRules = {
    hard: [
      "NPCs cannot teleport",
      "Dead NPCs stay dead",
      "Relationship changes must be earned",
      "Time flows forward",
      "Player choices have real consequences",
      "NPCs act according to their personality",
      "Consequences must be logical",
      "No magic solutions (unless magic exists)",
      "Respect established continuity",
      "No railroading - player agency matters"
    ],
    soft: [
      "NPCs usually act in self-interest",
      "Dramatic timing is allowed",
      "Coincidences are rare but possible",
      "NPCs can change minds with good reason",
      "Hidden info can be revealed dramatically"
    ],
    established: []
  };
  
  /**
   * Build complete prompt for dialogue generation
   */
  buildDialoguePrompt(context: DialogueContext): string {
    const template = this.selectTemplate(context.narrativeOpportunity.type);
    return this.fillTemplate(template, context);
  }
  
  /**
   * Select appropriate template
   */
  private selectTemplate(type: NarrativeType): PromptTemplate {
    const templates = {
      desperate_plea: this.CRISIS_TEMPLATE,
      betrayal_confrontation: this.CRISIS_TEMPLATE,
      romance_confession: this.EMOTIONAL_TEMPLATE,
      secret_revelation: this.REVELATION_TEMPLATE,
      ambient: this.AMBIENT_TEMPLATE,
      // ... more templates
    };
    
    return templates[type] || this.STANDARD_TEMPLATE;
  }
  
  /**
   * Standard dialogue template
   */
  private STANDARD_TEMPLATE = `
# GENERATE INK DIALOGUE SCRIPT

## WORLD RULES
${this.formatWorldRules()}

## CHARACTER: {{character_name}}
Role: {{character_role}}
Personality Traits: {{personality_traits}}
Current Emotion: {{current_emotion}} (intensity: {{emotion_intensity}}/100)
Relationship with Player: {{relationship}} ({{trust_level}})

## SITUATION
{{situation_description}}

## RECENT EVENTS
{{recent_events}}

## SPEECH PATTERN
Formality: {{formality}}/100
Verbosity: {{verbosity}}/100
{{speech_quirks}}

## REQUIREMENTS
Generate an Ink script that:
1. Matches character's personality and speech pattern
2. Reflects current emotional state naturally
3. Provides 2-4 meaningful player choices
4. Tracks consequences via Ink variables
5. Respects world rules
6. Uses realistic, character-appropriate dialogue

## VARIABLE TRACKING
Track these variables:
{{variables_to_track}}

## INK SCRIPT FORMAT
Output valid Ink syntax with:
- Variable declarations at top (VAR name = value)
- Conditional checks ({ condition: text })
- Player choices (+ [choice text])
- Variable modifications (~ variable_name += value)
- Clear narrative flow

BEGIN INK SCRIPT:
`;
  
  /**
   * Crisis dialogue template
   */
  private CRISIS_TEMPLATE = `
# GENERATE CRISIS DIALOGUE SCRIPT

## WORLD RULES
${this.formatWorldRules()}

## CRISIS: {{crisis_type}}
Urgency: {{urgency_level}}
Time Remaining: {{time_remaining}}
Consequence if Fail: {{consequence}}

## CHARACTER: {{character_name}}
Current State: {{emotional_state}} (INTENSE)
Desperation Level: {{desperation}}/100
Why They Need Player: {{reason_needs_help}}

## PLAYER RELATIONSHIP
Trust: {{trust_level}}
Recent History: {{recent_interactions}}
Can Player Help: {{can_help}}

## THIS IS A {{narrative_moment_type}} MOMENT
Emotional Peak: YES
Stakes: VERY HIGH
Consequences: PERMANENT

## REQUIREMENTS FOR CRISIS DIALOGUE
1. **Open strong** - Grab attention immediately
2. **Show emotion** - Character is at breaking point
3. **Clear stakes** - Player must understand what's at risk
4. **Real choice** - Not a fake decision
5. **Track everything** - All consequences must be variables
6. **Time pressure** - Urgency must be felt
7. **Character consistency** - Even in crisis, stay true to self

## BRANCHING REQUIREMENTS
Minimum 3 branches:
1. Player helps (major consequences)
2. Player refuses (major consequences)
3. Player asks questions (more info, decision delayed)

All branches must have REAL consequences tracked via variables.

## VARIABLE TRACKING
Required variables:
- {{character_name}}_relationship
- {{character_name}}_desperation
- quest_{{quest_id}} (if applicable)
- player_reputation
- {{other_variables}}

BEGIN INK SCRIPT:
`;
  
  /**
   * Fill template with context
   */
  private fillTemplate(template: string, context: DialogueContext): string {
    let filled = template;
    
    // Character info
    filled = filled.replace('{{character_name}}', context.character.name);
    filled = filled.replace('{{character_role}}', context.character.role);
    filled = filled.replace('{{current_emotion}}', context.character.currentEmotion);
    filled = filled.replace('{{emotion_intensity}}', context.character.emotionIntensity.toString());
    
    // Relationship
    filled = filled.replace('{{relationship}}', context.relationship.withPlayer.toString());
    filled = filled.replace('{{trust_level}}', context.relationship.trustLevel);
    
    // Personality
    filled = filled.replace('{{personality_traits}}', this.formatPersonality(context.character.personality));
    filled = filled.replace('{{formality}}', context.character.personality.speechPattern.formality.toString());
    filled = filled.replace('{{verbosity}}', context.character.personality.speechPattern.verbosity.toString());
    filled = filled.replace('{{speech_quirks}}', context.character.personality.speechPattern.quirks.join(', '));
    
    // Situation
    filled = filled.replace('{{situation_description}}', this.formatSituation(context.situation));
    filled = filled.replace('{{recent_events}}', this.formatRecentEvents(context.character.recentMemories));
    
    // Crisis info (if applicable)
    if (context.situation.crisis) {
      filled = filled.replace('{{crisis_type}}', context.situation.crisis.type);
      filled = filled.replace('{{urgency_level}}', context.situation.crisis.urgency);
      filled = filled.replace('{{time_remaining}}', context.situation.crisis.timeLimit?.toString() || "unknown");
      filled = filled.replace('{{consequence}}', context.situation.crisis.consequenceIfFail);
    }
    
    // Variables
    filled = filled.replace('{{variables_to_track}}', this.formatVariables(context.character.name));
    
    return filled;
  }
  
  private formatWorldRules(): string {
    return `
# HARD RULES (Cannot be broken)
${this.worldRules.hard.map((rule, i) => `${i+1}. ${rule}`).join('\n')}

# SOFT RULES (Can bend for good story reasons)
${this.worldRules.soft.map((rule, i) => `${i+1}. ${rule}`).join('\n')}
`;
  }
  
  private formatPersonality(personality: Personality): string {
    const traits = [];
    if (personality.traits.openness > 70) traits.push("open-minded");
    if (personality.traits.conscientiousness > 70) traits.push("reliable");
    if (personality.traits.extraversion > 70) traits.push("outgoing");
    else if (personality.traits.extraversion < 30) traits.push("reserved");
    if (personality.traits.agreeableness > 70) traits.push("friendly");
    else if (personality.traits.agreeableness < 30) traits.push("confrontational");
    if (personality.traits.neuroticism > 70) traits.push("anxious");
    
    return traits.join(', ');
  }
  
  private formatSituation(situation: SituationContext): string {
    let desc = "";
    
    if (situation.crisis) {
      desc += `CRISIS: ${situation.crisis.type}\n`;
      desc += `Urgency: ${situation.crisis.urgency}\n`;
      if (situation.crisis.victim) {
        desc += `Victim: ${situation.crisis.victim}\n`;
      }
    }
    
    if (situation.obstacles.length > 0) {
      desc += `\nObstacles:\n`;
      situation.obstacles.forEach(obs => {
        desc += `- ${obs.description} (severity: ${obs.severity})\n`;
      });
    }
    
    return desc;
  }
  
  private formatRecentEvents(memories: MemoryEntry[]): string {
    return memories.map(m => 
      `Day ${m.day}: ${m.event} (felt ${m.emotion}, impact: ${m.impact})`
    ).join('\n');
  }
  
  private formatVariables(characterName: string): string {
    return `
- ${characterName}_relationship (track relationship changes)
- ${characterName}_emotion (track emotional state)
- quest_active (if quest offered)
- player_reputation (general reputation)
- consequences_pending (for delayed effects)
`;
  }
}

type PromptTemplate = string;
```

### 3. Claude API Integration

```typescript
class ClaudeNarrativeEngine {
  
  constructor(
    private apiKey: string,
    private contextBuilder: NarrativeContextBuilder,
    private promptBuilder: ClaudePromptBuilder
  ) {}
  
  /**
   * Generate dialogue for NPC
   */
  async generateDialogue(npcId: string): Promise<InkScript> {
    // 1. Build context
    const context = this.contextBuilder.buildDialogueContext(npcId);
    
    // 2. Build prompt
    const prompt = this.promptBuilder.buildDialoguePrompt(context);
    
    // 3. Call Claude API
    const response = await this.callClaudeAPI(prompt);
    
    // 4. Parse response
    const inkScript = this.parseInkResponse(response);
    
    // 5. Validate
    const validated = this.validateInkScript(inkScript);
    
    return validated;
  }
  
  /**
   * Call Claude API
   */
  private async callClaudeAPI(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }],
        system: this.getSystemPrompt()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.content[0].text;
  }
  
  /**
   * System prompt for Claude
   */
  private getSystemPrompt(): string {
    return `You are a narrative AI for a living world simulation game. 

Your role is to generate Ink dialogue scripts that:
1. Feel authentic and character-driven
2. Respect the simulation state
3. Create meaningful player choices
4. Track consequences via variables
5. Maintain consistent character voices
6. Build emergent narratives

Always output valid Ink syntax. Never break character. Every choice must have real consequences.`;
  }
  
  /**
   * Parse Ink from Claude response
   */
  private parseInkResponse(response: string): InkScript {
    // Extract Ink script (Claude might add explanation)
    const inkMatch = response.match(/```ink\n([\s\S]*?)\n```/) || 
                     response.match(/```\n([\s\S]*?)\n```/);
    
    const raw = inkMatch ? inkMatch[1] : response;
    
    // Parse variables
    const variables = this.extractVariables(raw);
    
    // Parse knots
    const knots = this.extractKnots(raw);
    
    return {
      raw,
      variables,
      knots,
      hasErrors: false
    };
  }
  
  /**
   * Extract variables from Ink
   */
  private extractVariables(ink: string): InkVariable[] {
    const variables: InkVariable[] = [];
    const varRegex = /VAR\s+(\w+)\s*=\s*(.+)/g;
    
    let match;
    while ((match = varRegex.exec(ink)) !== null) {
      const name = match[1];
      const value = match[2].trim();
      
      variables.push({
        name,
        initialValue: this.parseValue(value),
        type: this.inferType(value)
      });
    }
    
    return variables;
  }
  
  /**
   * Extract knots from Ink
   */
  private extractKnots(ink: string): InkKnot[] {
    const knots: InkKnot[] = [];
    const knotRegex = /===\s+(\w+)\s+===/g;
    
    let match;
    while ((match = knotRegex.exec(ink)) !== null) {
      knots.push({
        name: match[1],
        type: "conversation" // Simplified
      });
    }
    
    return knots;
  }
  
  /**
   * Validate Ink script
   */
  private validateInkScript(script: InkScript): InkScript {
    const errors: string[] = [];
    
    // Check for required variables
    const requiredVars = ['relationship', 'emotion'];
    requiredVars.forEach(varName => {
      const hasVar = script.variables.some(v => v.name.includes(varName));
      if (!hasVar) {
        errors.push(`Missing required variable type: ${varName}`);
      }
    });
    
    // Check for knots
    if (script.knots.length === 0) {
      errors.push('No knots found - Ink script may be invalid');
    }
    
    // Check for choices
    if (!script.raw.includes('[')) {
      errors.push('No choices found - dialogue should offer player choices');
    }
    
    if (errors.length > 0) {
      return {
        ...script,
        hasErrors: true,
        errors
      };
    }
    
    return script;
  }
  
  private parseValue(value: string): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(Number(value))) return Number(value);
    return value.replace(/['"]/g, '');
  }
  
  private inferType(value: string): "number" | "boolean" | "string" {
    if (value === 'true' || value === 'false') return 'boolean';
    if (!isNaN(Number(value))) return 'number';
    return 'string';
  }
}
```

---

## 🔄 INTEGRATION EXAMPLE

### Complete Flow

```typescript
// Main integration class
class VibeMasterNarrativeSystem {
  
  private worldState: WorldState;
  private contextBuilder: NarrativeContextBuilder;
  private promptBuilder: ClaudePromptBuilder;
  private claudeEngine: ClaudeNarrativeEngine;
  private inkRuntime: InkDialogueSystem;
  
  constructor(worldState: WorldState, claudeApiKey: string) {
    this.worldState = worldState;
    this.contextBuilder = new NarrativeContextBuilder(worldState);
    this.promptBuilder = new ClaudePromptBuilder();
    this.claudeEngine = new ClaudeNarrativeEngine(
      claudeApiKey,
      this.contextBuilder,
      this.promptBuilder
    );
    this.inkRuntime = new InkDialogueSystem();
  }
  
  /**
   * Player interacts with NPC
   */
  async interactWithNPC(npcId: string): Promise<DialogueResult> {
    console.log(`Player talks to ${npcId}...`);
    
    // 1. Check if we need to regenerate dialogue
    const shouldRegenerate = this.shouldRegenerateDialogue(npcId);
    
    let inkScript: InkScript;
    
    if (shouldRegenerate) {
      console.log('Generating new dialogue...');
      // 2. Generate new dialogue
      inkScript = await this.claudeEngine.generateDialogue(npcId);
      
      // 3. Cache it
      this.cacheDialogue(npcId, inkScript);
    } else {
      console.log('Using cached dialogue...');
      // Use cached
      inkScript = this.getCachedDialogue(npcId);
    }
    
    // 4. Run dialogue
    const result = await this.inkRuntime.playDialogue(inkScript, npcId, this.worldState);
    
    // 5. Apply consequences
    this.applyConsequences(result);
    
    return result;
  }
  
  /**
   * Should we regenerate dialogue?
   */
  private shouldRegenerateDialogue(npcId: string): boolean {
    const npc = this.worldState.npcs[npcId];
    const lastGenerated = this.getLastGeneratedTimestamp(npcId);
    
    if (!lastGenerated) return true;
    
    // Check triggers
    return (
      this.emotionChangedSignificantly(npc, lastGenerated) ||
      this.newCrisisDetected(npc) ||
      this.goalPriorityChanged(npc, lastGenerated) ||
      this.relationshipShifted(npc, 'player', 20) ||
      this.majorEventOccurred(lastGenerated)
    );
  }
  
  /**
   * Apply consequences from dialogue to world
   */
  private applyConsequences(result: DialogueResult): void {
    // Update relationships
    for (const [npcId, change] of Object.entries(result.relationshipChanges)) {
      this.worldState.npcs[npcId].relationships['player'] += change;
    }
    
    // Add quests
    for (const quest of result.newQuests) {
      this.worldState.player.activeQuests.push(quest);
    }
    
    // Apply other consequences
    for (const consequence of result.consequences) {
      this.applyConsequence(consequence);
    }
  }
  
  // ... cache and helper methods
}
```

---

## 🎯 USAGE EXAMPLE

```typescript
// Initialize system
const worldState = loadWorldState();
const narrativeSystem = new VibeMasterNarrativeSystem(
  worldState,
  'your-claude-api-key'
);

// Player talks to Marcus
const result = await narrativeSystem.interactWithNPC('marcus');

console.log('Choice made:', result.choiceMade);
console.log('Relationship changes:', result.relationshipChanges);
console.log('New quests:', result.newQuests);
console.log('Consequences:', result.consequences);

// Result might be:
// {
//   choiceMade: "I'll help you find Sarah",
//   relationshipChanges: {
//     marcus: +20
//   },
//   newQuests: [{
//     id: 'rescue_sarah',
//     name: 'Find Sarah',
//     giver: 'marcus'
//   }],
//   consequences: [{
//     type: 'reputation',
//     effect: 'gain',
//     value: 10
//   }]
// }
```

---

This implementation guide provides the practical code structures you need to connect your living world simulation with AI-generated narratives. The key is the clean separation between:

1. **Simulation** (what's true)
2. **Context** (what matters)
3. **Generation** (what to say)
4. **Execution** (how player experiences it)

Each layer has clear interfaces and can be developed/tested independently!
