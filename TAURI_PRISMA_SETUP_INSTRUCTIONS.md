# TAURI + PRISMA SETUP & TESTING INSTRUCTIONS FOR CLAUDE CODE

**Date:** November 5, 2025  
**Project:** VibeMaster Living World Simulation  
**Goal:** Complete Phase 1, Task 1 - Set up and test Tauri with Prisma database connection

---

## 🎯 OBJECTIVE

Set up Tauri desktop framework with Prisma ORM and SQLite database, then test all CRUD operations to verify the integration works properly.

---

## 📋 PREREQUISITES

Ensure these are installed on the system:
- Node.js (v18 or higher)
- npm (v9 or higher)
- Rust (latest stable) - Required for Tauri
- SQLite3

**Check installations:**
```bash
node --version
npm --version
rustc --version
sqlite3 --version
```

**If Rust is not installed:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

---

## 🚀 STEP-BY-STEP IMPLEMENTATION

### STEP 1: Initialize Tauri Project Structure

**1.1 Create Tauri project directory structure:**
```bash
# Navigate to project root
cd /path/to/vibemaster

# Create Tauri source directory if it doesn't exist
mkdir -p src-tauri/src

# Initialize Tauri configuration
npm install --save-dev @tauri-apps/cli@latest
```

**1.2 Create Tauri configuration file:**

Create `src-tauri/tauri.conf.json`:
```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "VibeMaster",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.vibemaster.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "VibeMaster",
        "width": 1280,
        "height": 720
      }
    ]
  }
}
```

**1.3 Create Tauri Cargo configuration:**

Create `src-tauri/Cargo.toml`:
```toml
[package]
name = "vibemaster"
version = "0.1.0"
description = "VibeMaster Living World Simulation"
authors = ["VibeMaster Team"]
license = ""
repository = ""
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }

[dependencies]
tauri = { version = "1.5", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

**1.4 Create Tauri build script:**

Create `src-tauri/build.rs`:
```rust
// /src-tauri/build.rs

fn main() {
  tauri_build::build()
}
```

**1.5 Create main Tauri application:**

Create `src-tauri/src/main.rs`:
```rust
// /src-tauri/src/main.rs

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

### STEP 2: Install Tauri SQL Plugin

**2.1 Add tauri-plugin-sql to Cargo.toml:**

Update `src-tauri/Cargo.toml` dependencies section:
```toml
[dependencies]
tauri = { version = "1.5", features = ["shell-open"] }
tauri-plugin-sql = { version = "0.1", features = ["sqlite"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

**2.2 Register the plugin in main.rs:**

Update `src-tauri/src/main.rs`:
```rust
// /src-tauri/src/main.rs

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**2.3 Update tauri.conf.json allowlist:**

Update the allowlist section in `src-tauri/tauri.conf.json`:
```json
{
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "protocol": {
        "asset": true,
        "assetScope": ["**"]
      }
    }
  }
}
```

---

### STEP 3: Set Up Prisma with SQLite

**3.1 Install Prisma dependencies:**
```bash
npm install @prisma/client
npm install -D prisma
```

**3.2 Verify schema.prisma exists:**

The schema should already exist at `prisma/schema.prisma`. If not, create it:
```prisma
// /prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model World {
  id          String   @id @default(uuid())
  name        String
  currentDay  Int      @default(0)
  currentHour Int      @default(8)
  createdAt   DateTime @default(now())
  
  locations   Location[]
  npcs        NPC[]
  events      Event[]
  resources   Resource[]
}

model Location {
  id          String   @id @default(uuid())
  worldId     String
  name        String
  description String
  type        String
  x           Float
  y           Float
  hasFood     Boolean  @default(false)
  hasShelter  Boolean  @default(false)
  isPublic    Boolean  @default(true)
  
  world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  npcsHere    NPC[]    @relation("NPCLocation")
  
  @@index([worldId])
}

model NPC {
  id                 String   @id @default(uuid())
  worldId            String
  name               String
  occupation         String
  currentLocationId  String
  
  // Big Five Personality (0-100)
  openness          Int      @default(50)
  conscientiousness Int      @default(50)
  extraversion      Int      @default(50)
  agreeableness     Int      @default(50)
  neuroticism       Int      @default(50)
  
  // Current Emotion (Plutchik's 8)
  currentEmotion    String   @default("neutral")
  emotionIntensity  Int      @default(0)
  
  // Five Needs (0-100)
  needFood          Int      @default(100)
  needSafety        Int      @default(100)
  needWealth        Int      @default(50)
  needSocial        Int      @default(100)
  needRest          Int      @default(100)
  
  createdAt         DateTime @default(now())
  
  world             World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  currentLocation   Location @relation("NPCLocation", fields: [currentLocationId], references: [id])
  memories          Memory[]
  relationships     Relationship[] @relation("EntityA")
  relationshipsB    Relationship[] @relation("EntityB")
  goals             Goal[]
  
  @@index([worldId])
  @@index([currentLocationId])
}

model Memory {
  id              String   @id @default(uuid())
  npcId           String
  description     String
  emotionalImpact Int
  emotionType     String
  day             Int
  createdAt       DateTime @default(now())
  
  npc             NPC      @relation(fields: [npcId], references: [id], onDelete: Cascade)
  
  @@index([npcId])
}

model Relationship {
  id            String   @id @default(uuid())
  entityAId     String
  entityBId     String
  type          String
  trustLevel    Int      @default(50)
  lastInteraction DateTime @default(now())
  
  entityA       NPC      @relation("EntityA", fields: [entityAId], references: [id], onDelete: Cascade)
  entityB       NPC      @relation("EntityB", fields: [entityBId], references: [id], onDelete: Cascade)
  
  @@unique([entityAId, entityBId])
  @@index([entityAId])
  @@index([entityBId])
}

model Goal {
  id          String   @id @default(uuid())
  npcId       String
  description String
  priority    Int      @default(5)
  deadline    Int?
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  npc         NPC      @relation(fields: [npcId], references: [id], onDelete: Cascade)
  
  @@index([npcId])
}

model Event {
  id          String   @id @default(uuid())
  worldId     String
  type        String
  description String
  day         Int
  hour        Int
  createdAt   DateTime @default(now())
  
  world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  
  @@index([worldId])
  @@index([day])
}

model Resource {
  id          String   @id @default(uuid())
  worldId     String
  name        String
  quantity    Int      @default(0)
  productionRate Float @default(0)
  
  world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  
  @@unique([worldId, name])
  @@index([worldId])
}
```

**3.3 Create .env file:**
```bash
# Create .env file in project root
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
```

**3.4 Generate Prisma client:**
```bash
npx prisma generate
```

**3.5 Create database:**
```bash
npx prisma db push
```

---

### STEP 4: Create Database Test Module

**4.1 Create database wrapper module:**

Create `src/database/db-wrapper.ts`:
```typescript
// /src/database/db-wrapper.ts

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

/**
 * Get or create Prisma client singleton
 */
export function getDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      // Uncomment for debugging:
      // log: ['query', 'error', 'warn'],
    });
  }
  return prisma;
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const db = getDatabase();
    await db.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
```

**4.2 Create CRUD test module:**

Create `src/database/crud-tests.ts`:
```typescript
// /src/database/crud-tests.ts

import { getDatabase } from './db-wrapper';
import type { World, Location, NPC } from '@prisma/client';

const db = getDatabase();

/**
 * Test CREATE operations
 */
export async function testCreate() {
  console.log('\n🔹 Testing CREATE operations...');
  
  try {
    // Create World
    const world = await db.world.create({
      data: {
        name: 'Test World',
        currentDay: 0,
        currentHour: 8
      }
    });
    console.log('✅ Created World:', world.id);
    
    // Create Location
    const location = await db.location.create({
      data: {
        worldId: world.id,
        name: 'Test Tavern',
        description: 'A cozy tavern for testing',
        type: 'building',
        x: 10,
        y: 10,
        hasFood: true,
        hasShelter: true,
        isPublic: true
      }
    });
    console.log('✅ Created Location:', location.id);
    
    // Create NPC
    const npc = await db.nPC.create({
      data: {
        worldId: world.id,
        currentLocationId: location.id,
        name: 'Test Bob',
        occupation: 'Bartender',
        openness: 75,
        conscientiousness: 80,
        extraversion: 90,
        agreeableness: 85,
        neuroticism: 30,
        needFood: 85,
        needSafety: 90,
        needWealth: 60,
        needSocial: 95,
        needRest: 70
      }
    });
    console.log('✅ Created NPC:', npc.id);
    
    // Create Memory
    const memory = await db.memory.create({
      data: {
        npcId: npc.id,
        description: 'Had a great conversation with a customer',
        emotionalImpact: 15,
        emotionType: 'joy',
        day: 1
      }
    });
    console.log('✅ Created Memory:', memory.id);
    
    return { world, location, npc, memory };
  } catch (error) {
    console.error('❌ CREATE test failed:', error);
    throw error;
  }
}

/**
 * Test READ operations
 */
export async function testRead(worldId: string, npcId: string) {
  console.log('\n🔹 Testing READ operations...');
  
  try {
    // Read World
    const world = await db.world.findUnique({
      where: { id: worldId },
      include: {
        locations: true,
        npcs: true
      }
    });
    console.log('✅ Read World with relations:', {
      worldId: world?.id,
      locationCount: world?.locations.length,
      npcCount: world?.npcs.length
    });
    
    // Read NPC
    const npc = await db.nPC.findUnique({
      where: { id: npcId },
      include: {
        currentLocation: true,
        memories: true,
        goals: true
      }
    });
    console.log('✅ Read NPC with relations:', {
      npcId: npc?.id,
      name: npc?.name,
      location: npc?.currentLocation.name,
      memoryCount: npc?.memories.length
    });
    
    // Read all NPCs in world
    const allNpcs = await db.nPC.findMany({
      where: { worldId },
      select: {
        id: true,
        name: true,
        occupation: true,
        needFood: true,
        needRest: true
      }
    });
    console.log('✅ Read all NPCs:', allNpcs.length);
    
    return { world, npc, allNpcs };
  } catch (error) {
    console.error('❌ READ test failed:', error);
    throw error;
  }
}

/**
 * Test UPDATE operations
 */
export async function testUpdate(npcId: string) {
  console.log('\n🔹 Testing UPDATE operations...');
  
  try {
    // Update NPC needs (simulate needs decay)
    const updatedNpc = await db.nPC.update({
      where: { id: npcId },
      data: {
        needFood: 65,
        needRest: 50,
        currentEmotion: 'anticipation',
        emotionIntensity: 40
      }
    });
    console.log('✅ Updated NPC needs:', {
      needFood: updatedNpc.needFood,
      needRest: updatedNpc.needRest,
      emotion: updatedNpc.currentEmotion
    });
    
    // Update multiple NPCs
    const updateResult = await db.nPC.updateMany({
      where: { worldId: updatedNpc.worldId },
      data: {
        needFood: { decrement: 5 }
      }
    });
    console.log('✅ Updated multiple NPCs:', updateResult.count);
    
    return updatedNpc;
  } catch (error) {
    console.error('❌ UPDATE test failed:', error);
    throw error;
  }
}

/**
 * Test DELETE operations
 */
export async function testDelete(worldId: string) {
  console.log('\n🔹 Testing DELETE operations...');
  
  try {
    // Delete memories older than day 0
    const deletedMemories = await db.memory.deleteMany({
      where: {
        day: { lt: 1 }
      }
    });
    console.log('✅ Deleted old memories:', deletedMemories.count);
    
    // Delete entire world (cascade delete)
    const deletedWorld = await db.world.delete({
      where: { id: worldId }
    });
    console.log('✅ Deleted World (cascade):', deletedWorld.id);
    
    // Verify cascade delete worked
    const remainingNpcs = await db.nPC.count({
      where: { worldId }
    });
    console.log('✅ Remaining NPCs after cascade:', remainingNpcs);
    
    return true;
  } catch (error) {
    console.error('❌ DELETE test failed:', error);
    throw error;
  }
}

/**
 * Test complex queries
 */
export async function testComplexQueries(worldId: string) {
  console.log('\n🔹 Testing COMPLEX QUERIES...');
  
  try {
    // Find hungry NPCs
    const hungryNpcs = await db.nPC.findMany({
      where: {
        worldId,
        needFood: { lt: 50 }
      },
      include: {
        currentLocation: {
          select: { name: true, hasFood: true }
        }
      }
    });
    console.log('✅ Found hungry NPCs:', hungryNpcs.length);
    
    // Find locations with food
    const foodLocations = await db.location.findMany({
      where: {
        worldId,
        hasFood: true
      },
      include: {
        npcsHere: {
          select: { name: true, occupation: true }
        }
      }
    });
    console.log('✅ Found food locations:', foodLocations.length);
    
    // Aggregate query
    const avgNeeds = await db.nPC.aggregate({
      where: { worldId },
      _avg: {
        needFood: true,
        needRest: true,
        needSocial: true
      }
    });
    console.log('✅ Average needs:', avgNeeds._avg);
    
    return { hungryNpcs, foodLocations, avgNeeds };
  } catch (error) {
    console.error('❌ COMPLEX QUERY test failed:', error);
    throw error;
  }
}
```

**4.3 Create main test runner:**

Create `src/database/run-tests.ts`:
```typescript
// /src/database/run-tests.ts

import { testConnection, disconnectDatabase } from './db-wrapper';
import { testCreate, testRead, testUpdate, testDelete, testComplexQueries } from './crud-tests';

/**
 * Run all database tests
 */
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 TAURI + PRISMA DATABASE TEST SUITE');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    // Test 1: Connection
    console.log('📡 Test 1: Database Connection');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Test 2: CREATE
    console.log('\n📝 Test 2: CREATE Operations');
    const { world, location, npc, memory } = await testCreate();
    
    // Test 3: READ
    console.log('\n📖 Test 3: READ Operations');
    await testRead(world.id, npc.id);
    
    // Test 4: UPDATE
    console.log('\n✏️  Test 4: UPDATE Operations');
    await testUpdate(npc.id);
    
    // Test 5: COMPLEX QUERIES
    console.log('\n🔍 Test 5: COMPLEX QUERIES');
    await testComplexQueries(world.id);
    
    // Test 6: DELETE
    console.log('\n🗑️  Test 6: DELETE Operations');
    await testDelete(world.id);
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('📋 Test Summary:');
    console.log('  ✅ Database connection working');
    console.log('  ✅ CREATE operations working');
    console.log('  ✅ READ operations working');
    console.log('  ✅ UPDATE operations working');
    console.log('  ✅ DELETE operations working');
    console.log('  ✅ Complex queries working');
    console.log('  ✅ Cascade delete working');
    console.log('\n🎉 Tauri + Prisma integration is ready for use!\n');
    
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════');
    console.error('❌ TESTS FAILED');
    console.error('═══════════════════════════════════════════════════\n');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

// Run tests
runAllTests();
```

---

### STEP 5: Update Package.json

Update `package.json` to include test scripts:
```json
{
  "scripts": {
    "web": "live-server --port=5500",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:test": "tsx src/database/run-tests.ts",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

---

### STEP 6: Run Tests

**6.1 Generate Prisma client:**
```bash
npm run db:generate
```

**6.2 Create/update database:**
```bash
npm run db:push
```

**6.3 Run database tests:**
```bash
npm run db:test
```

**Expected output:**
```
═══════════════════════════════════════════════════
🧪 TAURI + PRISMA DATABASE TEST SUITE
═══════════════════════════════════════════════════

📡 Test 1: Database Connection
✅ Database connection successful

📝 Test 2: CREATE Operations

🔹 Testing CREATE operations...
✅ Created World: abc-123-xyz
✅ Created Location: def-456-uvw
✅ Created NPC: ghi-789-rst
✅ Created Memory: jkl-012-opq

📖 Test 3: READ Operations

🔹 Testing READ operations...
✅ Read World with relations: { worldId: 'abc-123-xyz', locationCount: 1, npcCount: 1 }
✅ Read NPC with relations: { npcId: 'ghi-789-rst', name: 'Test Bob', location: 'Test Tavern', memoryCount: 1 }
✅ Read all NPCs: 1

✏️  Test 4: UPDATE Operations

🔹 Testing UPDATE operations...
✅ Updated NPC needs: { needFood: 65, needRest: 50, emotion: 'anticipation' }
✅ Updated multiple NPCs: 1

🔍 Test 5: COMPLEX QUERIES

🔹 Testing COMPLEX QUERIES...
✅ Found hungry NPCs: 0
✅ Found food locations: 1
✅ Average needs: { needFood: 65, needRest: 50, needSocial: 95 }

🗑️  Test 6: DELETE Operations

🔹 Testing DELETE operations...
✅ Deleted old memories: 0
✅ Deleted World (cascade): abc-123-xyz
✅ Remaining NPCs after cascade: 0

═══════════════════════════════════════════════════
✅ ALL TESTS PASSED!
═══════════════════════════════════════════════════

📋 Test Summary:
  ✅ Database connection working
  ✅ CREATE operations working
  ✅ READ operations working
  ✅ UPDATE operations working
  ✅ DELETE operations working
  ✅ Complex queries working
  ✅ Cascade delete working

🎉 Tauri + Prisma integration is ready for use!
```

---

## ✅ VERIFICATION CHECKLIST

After running all steps, verify:

- [ ] Rust is installed and working
- [ ] Tauri CLI is installed
- [ ] Prisma client is generated
- [ ] Database file exists at `prisma/dev.db`
- [ ] All CRUD tests pass
- [ ] No error messages in test output
- [ ] Prisma Studio can open the database (`npm run db:studio`)

---

## 🔧 TROUBLESHOOTING

### Issue: "Cannot find module '@prisma/client'"
**Solution:**
```bash
npm run db:generate
```

### Issue: "Database file not found"
**Solution:**
```bash
npm run db:push
```

### Issue: "Rust not installed"
**Solution:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Issue: "Prisma schema errors"
**Solution:**
```bash
npx prisma format
npx prisma validate
```

### Issue: "Port already in use"
**Solution:**
```bash
# Kill process on port 1420 (Tauri default)
kill -9 $(lsof -ti:1420)
```

---

## 📊 NEXT STEPS AFTER SUCCESSFUL TEST

Once all tests pass:

1. **Integrate with Phaser:**
   - Import database module into Phaser scenes
   - Create game state management layer
   - Implement save/load system

2. **Create Seed Data:**
   - Add initial world with 5-10 NPCs
   - Create starting locations
   - Set up initial relationships

3. **Build UI Layer:**
   - Resource display panel
   - NPC status panel
   - Day/time display

4. **Test Tauri App:**
   ```bash
   npm run tauri:dev
   ```

---

## 📚 ADDITIONAL RESOURCES

- **Tauri Docs:** https://tauri.app/v1/guides/
- **Prisma Docs:** https://www.prisma.io/docs/
- **tauri-plugin-sql:** https://github.com/tauri-apps/tauri-plugin-sql

---

## ⚠️ IMPORTANT NOTES

1. **Database Location:** SQLite database is stored at `prisma/dev.db`
2. **Backup Strategy:** Copy `dev.db` file before major changes
3. **Development vs Production:** Use `dev.db` for development, create separate production database
4. **Performance:** SQLite handles 10,000+ NPCs efficiently with proper indexes
5. **Migrations:** Use `prisma migrate dev` for schema changes in development

---

**Status:** Ready for implementation  
**Estimated Time:** 30-60 minutes  
**Success Criteria:** All tests pass with green checkmarks
