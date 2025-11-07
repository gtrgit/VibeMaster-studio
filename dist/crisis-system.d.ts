export interface Crisis {
    type: CrisisType;
    severity: 'low' | 'medium' | 'high' | 'extreme';
    affectsDialogue: boolean;
    urgency: number;
}
export type CrisisType = 'starvation' | 'danger' | 'poverty' | 'illness' | 'emotional_breakdown' | 'desperation';
export interface CrisisDialogue {
    greeting: string;
    pleaForHelp: string;
    ifRefused: string;
}
export declare function detectCrisis(npc: any): Crisis | null;
export declare function getCrisisGreeting(npc: any, crisis: Crisis): string;
export declare function getCrisisWellbeingResponse(npc: any, crisis: Crisis): string;
export declare function getCrisisOccupationResponse(npc: any, crisis: Crisis): string;
export declare function shouldInterruptForCrisis(crisis: Crisis | null): boolean;
export declare function getCrisisDialogueOptions(npc: any, crisis: Crisis): Array<{
    text: string;
    action: string;
}>;
//# sourceMappingURL=crisis-system.d.ts.map