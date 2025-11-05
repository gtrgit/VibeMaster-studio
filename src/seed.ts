// seed.ts - Populate database with initial test data
import { getDatabase, safeJsonStringify } from './database';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  const db = getDatabase();

  console.log('🌱 Seeding database...');

  // Create world
  const world = await db.world.create({
    data: {
      name: 'Test Village',
      currentDay: 1,
      currentHour: 8
    }
  });

  console.log(`✅ Created world: ${world.name}`);

  // Create locations
  const tavern = await db.location.create({
    data: {
      worldId: world.id,
      name: 'The Drunken Dragon Tavern',
      description: 'A cozy tavern with a warm fireplace',
      type: 'building',
      hasFood: true,
      hasShelter: true,
      isPublic: true,
      isDangerous: false,
      dangerLevel: 0
    }
  });

  const forge = await db.location.create({
    data: {
      worldId: world.id,
      name: 'Marcus\'s Forge',
      description: 'A hot smithy filled with the sound of hammering',
      type: 'building',
      hasFood: false,
      hasShelter: true,
      isPublic: false,
      isDangerous: true,
      dangerLevel: 20
    }
  });

  const woods = await db.location.create({
    data: {
      worldId: world.id,
      name: 'Dark Woods',
      description: 'Dense forest on the edge of town',
      type: 'outdoor',
      hasFood: true,
      hasShelter: false,
      isPublic: true,
      isDangerous: true,
      dangerLevel: 60
    }
  });

  console.log(`✅ Created ${3} locations`);

  // Create NPCs
  const marcus = await db.nPC.create({
    data: {
      worldId: world.id,
      name: 'Marcus',
      age: 45,
      occupation: 'Blacksmith',
      locationId: forge.id,
      
      // Personality - gruff but caring
      openness: 40,
      conscientiousness: 80,
      extraversion: 30,
      agreeableness: 60,
      neuroticism: 50,
      
      values: safeJsonStringify(['family', 'honesty', 'hard work']),
      fears: safeJsonStringify(['losing loved ones', 'failure']),
      
      // Speech pattern - terse, direct
      formality: 40,
      verbosity: 30,
      emotionalExpression: 40,
      dialect: 'working class',
      speechQuirks: safeJsonStringify(['uses short sentences', 'gruff tone']),
      
      // Needs - stable
      needFood: 70,
      needSafety: 90,
      needWealth: 60,
      needSocial: 40,
      needPurpose: 80,
      
      // Emotions - content but worried
      emotionHappiness: 60,
      emotionAnger: 10,
      emotionFear: 30,
      emotionSadness: 20,
      emotionTrust: 70,
      emotionAnticipation: 40
    }
  });

  const sarah = await db.nPC.create({
    data: {
      worldId: world.id,
      name: 'Sarah',
      age: 18,
      occupation: 'Herbalist',
      state: 'alive', // Will become kidnapped later
      locationId: tavern.id,
      
      // Personality - kind and curious
      openness: 80,
      conscientiousness: 70,
      extraversion: 60,
      agreeableness: 85,
      neuroticism: 40,
      
      values: safeJsonStringify(['helping others', 'knowledge', 'nature']),
      fears: safeJsonStringify(['violence', 'darkness']),
      
      // Speech pattern - friendly, articulate
      formality: 60,
      verbosity: 70,
      emotionalExpression: 80,
      speechQuirks: safeJsonStringify(['uses plant metaphors']),
      
      // Needs - healthy
      needFood: 85,
      needSafety: 80,
      needWealth: 40,
      needSocial: 70,
      needPurpose: 75,
      
      // Emotions - happy and optimistic
      emotionHappiness: 75,
      emotionAnger: 5,
      emotionFear: 10,
      emotionSadness: 10,
      emotionTrust: 65,
      emotionAnticipation: 70
    }
  });

  const emma = await db.nPC.create({
    data: {
      worldId: world.id,
      name: 'Emma',
      age: 35,
      occupation: 'Baker',
      locationId: tavern.id,
      
      // Personality - warm and nurturing
      openness: 60,
      conscientiousness: 75,
      extraversion: 70,
      agreeableness: 80,
      neuroticism: 45,
      
      values: safeJsonStringify(['community', 'tradition', 'kindness']),
      fears: safeJsonStringify(['hunger', 'loneliness']),
      
      // Speech pattern - warm, conversational
      formality: 50,
      verbosity: 60,
      emotionalExpression: 75,
      speechQuirks: safeJsonStringify(['maternal tone', 'uses food metaphors']),
      
      // Needs - stable
      needFood: 90,
      needSafety: 85,
      needWealth: 55,
      needSocial: 80,
      needPurpose: 70,
      
      // Emotions - content
      emotionHappiness: 70,
      emotionAnger: 5,
      emotionFear: 15,
      emotionSadness: 15,
      emotionTrust: 75,
      emotionAnticipation: 50
    }
  });

  console.log(`✅ Created ${3} NPCs`);

  // Create relationships
  await db.relationship.create({
    data: {
      fromNpcId: marcus.id,
      toNpcId: sarah.id,
      value: 100,
      trust: 100,
      affection: 100,
      respect: 80,
      grudge: 0,
      fear: 0
    }
  });

  await db.relationship.create({
    data: {
      fromNpcId: sarah.id,
      toNpcId: marcus.id,
      value: 95,
      trust: 100,
      affection: 95,
      respect: 90,
      grudge: 0,
      fear: 0
    }
  });

  await db.relationship.create({
    data: {
      fromNpcId: marcus.id,
      toNpcId: emma.id,
      value: 40,
      trust: 50,
      affection: 30,
      respect: 60,
      grudge: 0,
      fear: 0
    }
  });

  console.log(`✅ Created relationships`);

  // Create initial goals
  await db.goal.create({
    data: {
      npcId: marcus.id,
      type: 'wealth',
      priority: 60,
      urgent: false,
      desperate: false
    }
  });

  await db.goal.create({
    data: {
      npcId: sarah.id,
      type: 'knowledge',
      priority: 70,
      urgent: false,
      desperate: false
    }
  });

  console.log(`✅ Created initial goals`);

  // Create player
  await db.player.create({
    data: {
      name: 'Player',
      reputation: 50,
      relationships: safeJsonStringify({}),
      activeQuests: safeJsonStringify([]),
      completedQuests: safeJsonStringify([]),
      failedQuests: safeJsonStringify([]),
      recentChoices: safeJsonStringify([])
    }
  });

  console.log(`✅ Created player`);

  console.log('\n🎉 Seeding complete!');
  console.log(`\nWorld ID: ${world.id}`);
  console.log(`Marcus ID: ${marcus.id}`);
  console.log(`Sarah ID: ${sarah.id}`);
  console.log(`Emma ID: ${emma.id}`);

  await db.$disconnect();
}

seed()
  .catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
