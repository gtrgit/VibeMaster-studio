// index.ts - Main entry point
import { getDatabase, disconnectDatabase } from './database';
import { WorldSimulation } from './simulation/WorldSimulation';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🎮 VibeMaster Simulation Engine');
  console.log('================================\n');

  const db = getDatabase();

  try {
    // Get the first world (or create one if none exists)
    let world = await db.world.findFirst();

    if (!world) {
      console.log('⚠️  No world found. Please run: npm run db:seed');
      process.exit(1);
    }

    console.log(`🌍 Loading world: ${world.name}`);
    console.log(`📅 Current time: Day ${world.currentDay}, Hour ${world.currentHour}:00\n`);

    // Create simulation
    const simulation = new WorldSimulation(db, world.id, {
      tickSpeed: 2000,        // 2 seconds per tick (2 seconds = 1 hour in-game)
      autoSaveInterval: 10,   // Save every 10 ticks
      enableLogging: true,
      logLevel: 'info'
    });

    // Initialize
    await simulation.initialize();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down...');
      simulation.stop();
      await disconnectDatabase();
      process.exit(0);
    });

    // Start simulation
    console.log('▶️  Starting simulation... (Press Ctrl+C to stop)\n');
    await simulation.start();

  } catch (error) {
    console.error('❌ Error:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

main();
