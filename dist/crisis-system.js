"use strict";
// Crisis detection and response system
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectCrisis = detectCrisis;
exports.getCrisisGreeting = getCrisisGreeting;
exports.getCrisisWellbeingResponse = getCrisisWellbeingResponse;
exports.getCrisisOccupationResponse = getCrisisOccupationResponse;
exports.shouldInterruptForCrisis = shouldInterruptForCrisis;
exports.getCrisisDialogueOptions = getCrisisDialogueOptions;
function detectCrisis(npc) {
    // Check for starvation
    if (npc.needFood < 20) {
        return {
            type: 'starvation',
            severity: npc.needFood < 10 ? 'extreme' : 'high',
            affectsDialogue: true,
            urgency: 100 - npc.needFood
        };
    }
    // Check for danger
    if (npc.needSafety < 20) {
        return {
            type: 'danger',
            severity: npc.needSafety < 10 ? 'extreme' : 'high',
            affectsDialogue: true,
            urgency: 100 - npc.needSafety
        };
    }
    // Check for poverty
    if (npc.needWealth < 10) {
        return {
            type: 'poverty',
            severity: 'medium',
            affectsDialogue: true,
            urgency: 50
        };
    }
    // Check for emotional breakdown
    if (npc.emotionSadness > 80 && npc.emotionHappiness < 20) {
        return {
            type: 'emotional_breakdown',
            severity: 'high',
            affectsDialogue: true,
            urgency: 70
        };
    }
    // Check for general desperation
    const avgNeed = (npc.needFood + npc.needSafety + npc.needWealth) / 3;
    if (avgNeed < 25) {
        return {
            type: 'desperation',
            severity: avgNeed < 15 ? 'extreme' : 'high',
            affectsDialogue: true,
            urgency: 100 - avgNeed
        };
    }
    return null;
}
function getCrisisGreeting(npc, crisis) {
    const name = npc.name;
    switch (crisis.type) {
        case 'starvation':
            if (crisis.severity === 'extreme') {
                return `${name}: *gasps weakly* "Please... I haven't eaten in days... I can barely stand..."`;
            }
            else {
                return `${name}: "Thank goodness you're here! I'm so hungry... do you have any food?"`;
            }
        case 'danger':
            if (crisis.severity === 'extreme') {
                return `${name}: *trembling* "Help me! I'm in terrible danger! They're coming for me!"`;
            }
            else {
                return `${name}: "Oh, you! Please, I need your help - it's not safe here anymore!"`;
            }
        case 'poverty':
            return `${name}: "I hate to ask, but... I've lost everything. I don't know what to do..."`;
        case 'emotional_breakdown':
            return `${name}: *sobbing* "I can't... I just can't do this anymore... Everything's falling apart..."`;
        case 'desperation':
            if (crisis.severity === 'extreme') {
                return `${name}: *desperately grabs your arm* "Please! I need help! Anything... I'm begging you!"`;
            }
            else {
                return `${name}: "I'm sorry to burden you, but I'm desperate... I need help so badly..."`;
            }
        default:
            return `${name}: "Please... I need help..."`;
    }
}
function getCrisisWellbeingResponse(npc, crisis) {
    switch (crisis.type) {
        case 'starvation':
            if (crisis.severity === 'extreme') {
                return "I'm dying... I can feel my strength leaving me. Without food soon, I won't make it. Please, I'm begging you, do you have anything to eat?";
            }
            else {
                return "I'm starving! My stomach hurts so much... I've been trying to find food but there's nothing. Can you help me?";
            }
        case 'danger':
            if (crisis.severity === 'extreme') {
                return "I'm terrified! They'll kill me if they find me! I need to get somewhere safe RIGHT NOW! Please help me!";
            }
            else {
                return "I'm in serious danger. I can't tell you everything, but I need to find safety. Will you help me?";
            }
        case 'poverty':
            return "I've lost everything... my savings, my home, my dignity. I don't know how to start over. I'm completely broke.";
        case 'emotional_breakdown':
            return "I can't cope anymore... Everything I touch falls apart. Everyone I love leaves me. I don't see any point in going on...";
        case 'desperation':
            if (crisis.severity === 'extreme') {
                return "Everything is wrong! I have nothing! No food, no safety, no hope! I'm at the end of my rope! PLEASE HELP ME!";
            }
            else {
                return "I'm barely surviving. Every day is a struggle. I need food, I need safety, I need... I need help. Please.";
            }
        default:
            return "I'm not doing well at all. I desperately need help.";
    }
}
function getCrisisOccupationResponse(npc, crisis) {
    const occupation = npc.occupation || "person";
    switch (crisis.type) {
        case 'starvation':
            return `I'm supposed to be a ${occupation}, but I can't even work... I'm too weak from hunger. I'd do ANY job for some food right now.`;
        case 'danger':
            return `Being a ${occupation} doesn't matter when your life is in danger! I can't work, I can't think about anything except staying alive!`;
        case 'poverty':
            return `I was a ${occupation}, but I've lost everything. My tools, my shop, my customers... I can't work without resources.`;
        case 'emotional_breakdown':
            return `${occupation}? What's the point? I can't focus on work when my world is falling apart. I've lost all motivation...`;
        case 'desperation':
            return `I'm a ${occupation}, or I was... Now I'm just trying to survive. I'll do anything - ANY work - just to get by.`;
        default:
            return `I can't focus on being a ${occupation} right now. I have much bigger problems.`;
    }
}
// Check if NPC would interrupt normal conversation due to crisis
function shouldInterruptForCrisis(crisis) {
    if (!crisis)
        return false;
    return crisis.severity === 'extreme' || crisis.urgency > 80;
}
// Get crisis-specific dialogue options
function getCrisisDialogueOptions(npc, crisis) {
    const options = [];
    switch (crisis.type) {
        case 'starvation':
            options.push({ text: "I have some food for you", action: "give_food" });
            options.push({ text: "Where can we find food?", action: "ask_food_source" });
            break;
        case 'danger':
            options.push({ text: "I'll protect you", action: "offer_protection" });
            options.push({ text: "What's the danger?", action: "ask_danger" });
            break;
        case 'poverty':
            options.push({ text: "I can give you some coins", action: "give_money" });
            options.push({ text: "Maybe I can find you work", action: "offer_job" });
            break;
        case 'emotional_breakdown':
            options.push({ text: "Talk to me, I'm listening", action: "comfort" });
            options.push({ text: "You need to be strong", action: "tough_love" });
            break;
        case 'desperation':
            options.push({ text: "Tell me what you need most", action: "assess_needs" });
            options.push({ text: "I'll do what I can", action: "general_help" });
            break;
    }
    // Always add option to leave
    options.push({ text: "I can't help right now", action: "refuse_help" });
    return options;
}
//# sourceMappingURL=crisis-system.js.map