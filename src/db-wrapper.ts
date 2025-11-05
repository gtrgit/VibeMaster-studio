import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client with logging
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query'
    },
    {
      emit: 'event',
      level: 'error'
    },
    {
      emit: 'stdout',
      level: 'info'
    },
    {
      emit: 'stdout',
      level: 'warn'
    }
  ]
});

// Log query events
prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Duration:', e.duration, 'ms');
});

// Handle process termination gracefully
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Export the client and utility functions
export { prisma };

// Database health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Seed initial test data
export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  try {
    // Create a world
    const world = await prisma.world.create({
      data: {
        name: 'Test World',
        currentDay: 1,
        currentHour: 8
      }
    });
    console.log('✅ Created world:', world.name);

    // Create locations
    const tavern = await prisma.location.create({
      data: {
        worldId: world.id,
        name: 'The Rusty Anchor',
        description: 'A cozy tavern by the docks',
        type: 'building',
        hasFood: true,
        hasShelter: true,
        isPublic: true
      }
    });

    const market = await prisma.location.create({
      data: {
        worldId: world.id,
        name: 'Market Square',
        description: 'The bustling heart of the city',
        type: 'outdoor',
        hasFood: true,
        hasShelter: false,
        isPublic: true
      }
    });

    console.log('✅ Created locations');

    // Create NPCs
    const npcs = await Promise.all([
      prisma.nPC.create({
        data: {
          worldId: world.id,
          locationId: tavern.id,
          name: 'Marcus',
          age: 35,
          occupation: 'Tavern Keeper',
          // Personality: Friendly and extroverted
          extraversion: 75,
          agreeableness: 80,
          conscientiousness: 70,
          openness: 60,
          neuroticism: 30,
          values: JSON.stringify(['honesty', 'community', 'prosperity']),
          fears: JSON.stringify(['bankruptcy', 'violence'])
        }
      }),
      prisma.nPC.create({
        data: {
          worldId: world.id,
          locationId: market.id,
          name: 'Sarah',
          age: 28,
          occupation: 'Merchant',
          // Personality: Ambitious and careful
          extraversion: 60,
          agreeableness: 50,
          conscientiousness: 85,
          openness: 70,
          neuroticism: 40,
          values: JSON.stringify(['wealth', 'independence', 'family']),
          fears: JSON.stringify(['poverty', 'failure'])
        }
      }),
      prisma.nPC.create({
        data: {
          worldId: world.id,
          locationId: market.id,
          name: 'Emma',
          age: 19,
          occupation: 'Street Performer',
          // Personality: Creative and anxious
          extraversion: 65,
          agreeableness: 70,
          conscientiousness: 40,
          openness: 90,
          neuroticism: 70,
          values: JSON.stringify(['freedom', 'art', 'recognition']),
          fears: JSON.stringify(['obscurity', 'criticism', 'hunger'])
        }
      })
    ]);

    console.log('✅ Created NPCs:', npcs.map(n => n.name).join(', '));

    // Create relationships
    await prisma.relationship.create({
      data: {
        fromNpcId: npcs[0].id, // Marcus
        toNpcId: npcs[1].id,   // Sarah
        value: 60,
        trust: 70,
        affection: 50,
        respect: 65
      }
    });

    await prisma.relationship.create({
      data: {
        fromNpcId: npcs[1].id, // Sarah
        toNpcId: npcs[2].id,   // Emma
        value: 30,
        trust: 20,
        affection: 40,
        respect: 25
      }
    });

    console.log('✅ Created relationships');

    // Create a goal
    await prisma.goal.create({
      data: {
        npcId: npcs[2].id, // Emma
        type: 'wealth',
        target: '100 gold pieces',
        priority: 80,
        urgent: true,
        plan: JSON.stringify([
          'Perform in the market square',
          'Save money',
          'Find a patron'
        ])
      }
    });

    console.log('✅ Created goals');

    // Create an event
    await prisma.event.create({
      data: {
        worldId: world.id,
        day: 1,
        hour: 10,
        type: 'performance',
        description: 'Emma performs a captivating dance in the market square',
        locationId: market.id,
        dramaticValue: 70,
        participants: {
          connect: [{ id: npcs[2].id }]
        }
      }
    });

    console.log('✅ Created events');

    // Create a memory
    await prisma.memory.create({
      data: {
        npcId: npcs[0].id,
        day: 1,
        event: 'Saw Emma perform in the market',
        emotion: 'impressed',
        emotionalImpact: 60,
        involvedNpcs: JSON.stringify([npcs[2].id])
      }
    });

    console.log('✅ Created memories');

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Clean up all data
export async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  
  try {
    // Delete in order to respect foreign key constraints
    await prisma.memory.deleteMany();
    await prisma.goal.deleteMany();
    await prisma.relationship.deleteMany();
    await prisma.event.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.nPC.deleteMany();
    await prisma.location.deleteMany();
    await prisma.faction.deleteMany();
    await prisma.world.deleteMany();
    await prisma.player.deleteMany();
    
    console.log('✅ Database cleaned');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
}