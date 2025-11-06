// Personality system for NPCs - Based on Big Five personality traits

export interface PersonalityTraits {
  openness: number;          // 0-100 (creative, curious, open to new experiences)
  conscientiousness: number; // 0-100 (organized, dependable, disciplined)
  extraversion: number;      // 0-100 (outgoing, energetic, talkative)
  agreeableness: number;     // 0-100 (cooperative, trusting, helpful)
  neuroticism: number;       // 0-100 (anxious, moody, emotionally unstable)
}

export interface NPCPersonality {
  name: string;
  traits: PersonalityTraits;
}

// Predefined personalities for our NPCs
export const NPC_PERSONALITIES: Record<string, NPCPersonality> = {
  "Marcus": {
    name: "Marcus",
    traits: {
      openness: 40,          // Traditional blacksmith, sticks to what he knows
      conscientiousness: 85, // Very disciplined and hardworking
      extraversion: 70,      // Fairly outgoing, enjoys talking to customers
      agreeableness: 65,     // Generally helpful but can be stubborn
      neuroticism: 30        // Stable and calm under pressure
    }
  },
  "Sarah": {
    name: "Sarah",
    traits: {
      openness: 75,          // Merchant, always looking for new opportunities
      conscientiousness: 70, // Good at managing her business
      extraversion: 60,      // Social enough for business but not overly outgoing
      agreeableness: 50,     // Neutral - friendly to customers, tough negotiator
      neuroticism: 45        // Some worry about business, but generally stable
    }
  },
  "Emma": {
    name: "Emma",
    traits: {
      openness: 60,          // Healer interested in new remedies
      conscientiousness: 80, // Careful and precise with healing
      extraversion: 35,      // Quiet and reserved
      agreeableness: 90,     // Very caring and helpful
      neuroticism: 55        // Worries about her patients
    }
  }
};

// Helper functions to interpret personality
export function getPersonalityDescription(traits: PersonalityTraits): string[] {
  const descriptions: string[] = [];

  // Openness
  if (traits.openness > 70) descriptions.push("creative and curious");
  else if (traits.openness < 30) descriptions.push("traditional and practical");

  // Conscientiousness
  if (traits.conscientiousness > 70) descriptions.push("disciplined and reliable");
  else if (traits.conscientiousness < 30) descriptions.push("spontaneous and flexible");

  // Extraversion
  if (traits.extraversion > 70) descriptions.push("outgoing and talkative");
  else if (traits.extraversion < 30) descriptions.push("quiet and reserved");

  // Agreeableness
  if (traits.agreeableness > 70) descriptions.push("helpful and trusting");
  else if (traits.agreeableness < 30) descriptions.push("skeptical and independent");

  // Neuroticism
  if (traits.neuroticism > 70) descriptions.push("anxious and moody");
  else if (traits.neuroticism < 30) descriptions.push("calm and stable");

  return descriptions;
}

// Get personality-based greeting
export function getPersonalityGreeting(npc: any, personality: NPCPersonality): string {
  const traits = personality.traits;
  
  // High extraversion - enthusiastic greeting
  if (traits.extraversion > 70) {
    if (npc.emotionHappiness > 70) {
      return `${npc.name}: "Well hello there! What a wonderful day to see you! How can I help you today?"`;
    } else {
      return `${npc.name}: "Oh, hello! I wasn't expecting visitors, but it's good to see someone!"`;
    }
  }
  
  // Low extraversion - reserved greeting
  else if (traits.extraversion < 40) {
    if (npc.emotionHappiness > 70) {
      return `${npc.name}: "Oh... hello. It's nice to see you."`;
    } else {
      return `${npc.name}: "Yes? What do you need?"`;
    }
  }
  
  // Medium extraversion - balanced greeting
  else {
    if (npc.emotionHappiness > 70) {
      return `${npc.name}: "Hello there! Good to see you. What brings you by?"`;
    } else {
      return `${npc.name}: "Hello. How can I help you?"`;
    }
  }
}

// Get personality-based response to "How are you?"
export function getPersonalityWellbeingResponse(npc: any, personality: NPCPersonality): string {
  const traits = personality.traits;
  const avgNeed = (npc.needFood + npc.needSafety) / 2;
  
  // High neuroticism - more dramatic/worried responses
  if (traits.neuroticism > 60) {
    if (avgNeed < 30) {
      return "I'm absolutely terrible! Everything is falling apart! I don't know how much longer I can go on like this!";
    } else if (avgNeed < 60) {
      return "I'm so worried about everything... The future seems uncertain and I can't stop thinking about what might go wrong.";
    } else {
      return "I'm doing alright, I suppose, but I can't help worrying about what tomorrow might bring...";
    }
  }
  
  // Low neuroticism - calmer responses
  else if (traits.neuroticism < 40) {
    if (avgNeed < 30) {
      return "Times are tough, but I'm managing. I've been through worse and I'll get through this too.";
    } else if (avgNeed < 60) {
      return "Things could be better, but I'm staying positive. No point in worrying too much.";
    } else {
      return "I'm doing quite well, thank you. Life has its ups and downs, but overall I can't complain.";
    }
  }
  
  // Medium neuroticism - balanced responses
  else {
    if (avgNeed < 30) {
      return "I'm struggling, to be honest. These are difficult times and I could really use some help.";
    } else if (avgNeed < 60) {
      return "I'm managing, though things have been challenging lately. But I'm hopeful they'll improve.";
    } else {
      return "I'm doing well, thank you for asking. Life is treating me fairly these days.";
    }
  }
}

// Get personality-based occupation response
export function getPersonalityOccupationResponse(npc: any, personality: NPCPersonality, task: any, currentHour?: number): string {
  const traits = personality.traits;
  const occupation = npc.occupation || "Villager";
  
  // High conscientiousness - detailed and proud of work
  if (traits.conscientiousness > 70) {
    if (task) {
      const hoursLeft = currentHour ? task.endHour - currentHour : 'a few';
      return `I'm a ${occupation}, and I take great pride in my work. Currently, I'm carefully crafting ${task.amount}x ${task.resource}. It should be ready in exactly ${hoursLeft} hours - I never miss a deadline.`;
    } else {
      return `I'm a ${occupation}, and I always ensure my work meets the highest standards. When I have the right materials, I can produce quality goods that last.`;
    }
  }
  
  // Low conscientiousness - more casual about work
  else if (traits.conscientiousness < 40) {
    if (task) {
      const hoursLeft = currentHour ? task.endHour - currentHour : 'a few';
      return `Oh, I'm a ${occupation}. Right now I'm working on some ${task.resource}... should be done in about ${hoursLeft} hours, give or take.`;
    } else {
      return `I'm a ${occupation}. I make things when I feel like it or when people need them. Pretty relaxed job, really.`;
    }
  }
  
  // Medium conscientiousness - balanced approach
  else {
    if (task) {
      const hoursLeft = currentHour ? task.endHour - currentHour : 'several';
      return `I'm a ${occupation}, currently working on ${task.amount}x ${task.resource}. Should be done in ${hoursLeft} hours.`;
    } else {
      return `I'm a ${occupation}. I do my part to keep our community running smoothly.`;
    }
  }
}