export interface PersonalityTraits {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
}
export interface NPCPersonality {
    name: string;
    traits: PersonalityTraits;
}
export declare const NPC_PERSONALITIES: Record<string, NPCPersonality>;
export declare function getPersonalityDescription(traits: PersonalityTraits): string[];
export declare function getPersonalityGreeting(npc: any, personality: NPCPersonality): string;
export declare function getPersonalityWellbeingResponse(npc: any, personality: NPCPersonality): string;
export declare function getPersonalityOccupationResponse(npc: any, personality: NPCPersonality, task: any, currentHour?: number): string;
//# sourceMappingURL=personality-system.d.ts.map