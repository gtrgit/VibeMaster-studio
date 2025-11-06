import { getDatabase } from "./src/database";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("Testing database connection...");
console.log("DATABASE_URL:", process.env.DATABASE_URL);

async function testConnection() {
  try {
    const db = getDatabase();
    console.log("✅ Created database instance");
    
    // Test 1: Count worlds
    const worldCount = await db.world.count();
    console.log(`✅ World count: ${worldCount}`);
    
    // Test 2: Fetch first world
    const world = await db.world.findFirst({
      include: {
        npcs: {
          select: {
            id: true,
            name: true,
            occupation: true,
          }
        }
      }
    });
    
    if (world) {
      console.log(`✅ Found world: ${world.name}`);
      console.log(`   Day: ${world.currentDay}, Hour: ${world.currentHour}`);
      console.log(`   NPCs: ${world.npcs.length}`);
      world.npcs.forEach(npc => {
        console.log(`     - ${npc.name} (${npc.occupation})`);
      });
    } else {
      console.log("❌ No world found in database");
    }
    
  } catch (error) {
    console.error("❌ Database error:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
  } finally {
    // Disconnect
    const db = getDatabase();
    await db.$disconnect();
  }
}

testConnection();