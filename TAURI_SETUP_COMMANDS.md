# TAURI + PRISMA SETUP - COMMAND SEQUENCE

**Execute these commands in order. Each section must complete successfully before moving to the next.**

---

## 🔍 SECTION 1: VERIFY PREREQUISITES

```bash
# Check Node.js (should be v18+)
node --version

# Check npm (should be v9+)
npm --version

# Check Rust (if missing, see installation below)
rustc --version

# Check SQLite
sqlite3 --version
```

### If Rust is not installed:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustc --version
```

---

## 📁 SECTION 2: CREATE DIRECTORY STRUCTURE

```bash
# Create Tauri directory structure
mkdir -p src-tauri/src

# Create database directory structure
mkdir -p src/database
```

---

## 📦 SECTION 3: INSTALL DEPENDENCIES

```bash
# Install Tauri CLI
npm install --save-dev @tauri-apps/cli@latest

# Install Prisma
npm install @prisma/client
npm install -D prisma

# Verify installations
npm list @tauri-apps/cli
npm list @prisma/client
npm list prisma
```

---

## 📝 SECTION 4: CREATE TAURI CONFIGURATION FILES

### 4.1 Create tauri.conf.json
```bash
cat > src-tauri/tauri.conf.json << 'EOF'
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
      },
      "protocol": {
        "asset": true,
        "assetScope": ["**"]
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
EOF
```

### 4.2 Create Cargo.toml
```bash
cat > src-tauri/Cargo.toml << 'EOF'
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
tauri-plugin-sql = { version = "0.1", features = ["sqlite"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
EOF
```

### 4.3 Create build.rs
```bash
cat > src-tauri/build.rs << 'EOF'
// /src-tauri/build.rs

fn main() {
  tauri_build::build()
}
EOF
```

### 4.4 Create main.rs
```bash
cat > src-tauri/src/main.rs << 'EOF'
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
EOF
```

---

## 💾 SECTION 5: SETUP PRISMA

### 5.1 Create .env file
```bash
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
```

### 5.2 Verify schema.prisma exists
```bash
# Check if schema exists
ls -la prisma/schema.prisma

# If schema doesn't exist, it should have been in project files
# If missing, check project documentation for correct schema
```

### 5.3 Generate Prisma Client
```bash
npx prisma generate
```

### 5.4 Create Database
```bash
npx prisma db push
```

### 5.5 Verify database was created
```bash
ls -la prisma/dev.db
```

---

## 🧪 SECTION 6: CREATE TEST FILES

### 6.1 Create db-wrapper.ts
```bash
cat > src/database/db-wrapper.ts << 'EOF'
// /src/database/db-wrapper.ts

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

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
EOF
```

### 6.2 Create crud-tests.ts
**Note:** This file is too long for a single cat command. Use the full file from TAURI_PRISMA_SETUP_INSTRUCTIONS.md

```bash
# Copy the crud-tests.ts content from the instructions document
# It contains all the test functions for CREATE, READ, UPDATE, DELETE operations
```

### 6.3 Create run-tests.ts
**Note:** This file is too long for a single cat command. Use the full file from TAURI_PRISMA_SETUP_INSTRUCTIONS.md

```bash
# Copy the run-tests.ts content from the instructions document
# It contains the main test runner
```

---

## 📝 SECTION 7: UPDATE PACKAGE.JSON

Add these scripts to your package.json scripts section:
```json
{
  "scripts": {
    "db:generate": "prisma generate",
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

## ✅ SECTION 8: RUN TESTS

### 8.1 Regenerate Prisma client (in case of any changes)
```bash
npm run db:generate
```

### 8.2 Run the test suite
```bash
npm run db:test
```

### 8.3 Expected successful output:
```
═══════════════════════════════════════════════════
🧪 TAURI + PRISMA DATABASE TEST SUITE
═══════════════════════════════════════════════════

📡 Test 1: Database Connection
✅ Database connection successful

📝 Test 2: CREATE Operations
✅ Created World: [uuid]
✅ Created Location: [uuid]
✅ Created NPC: [uuid]
✅ Created Memory: [uuid]

📖 Test 3: READ Operations
✅ Read World with relations
✅ Read NPC with relations
✅ Read all NPCs

✏️  Test 4: UPDATE Operations
✅ Updated NPC needs
✅ Updated multiple NPCs

🔍 Test 5: COMPLEX QUERIES
✅ Found hungry NPCs
✅ Found food locations
✅ Average needs

🗑️  Test 6: DELETE Operations
✅ Deleted old memories
✅ Deleted World (cascade)
✅ Remaining NPCs after cascade

═══════════════════════════════════════════════════
✅ ALL TESTS PASSED!
═══════════════════════════════════════════════════
```

---

## 🎨 SECTION 9 (OPTIONAL): OPEN PRISMA STUDIO

```bash
# Open Prisma Studio to visually inspect database
npm run db:studio

# This will open http://localhost:5555 in your browser
# You can browse all tables and data
```

---

## 🏁 COMPLETION CHECKLIST

After running all commands, verify:

- [ ] All tests show ✅ checkmarks
- [ ] Final output says "ALL TESTS PASSED!"
- [ ] File exists: `prisma/dev.db`
- [ ] Can run `npm run db:studio` without errors
- [ ] No error messages in any output

---

## 🚨 IF ERRORS OCCUR

### Common Error 1: "Cannot find module '@prisma/client'"
```bash
npm run db:generate
npm run db:test
```

### Common Error 2: "Database not found"
```bash
rm -f prisma/dev.db  # Remove if exists
npm run db:push
npm run db:test
```

### Common Error 3: "Rust compilation errors"
```bash
# Update Rust
rustup update stable
cargo clean
```

### Common Error 4: "Schema validation failed"
```bash
npx prisma format
npx prisma validate
```

### Nuclear Option: Start Fresh
```bash
# Remove all generated files
rm -rf node_modules
rm -rf prisma/dev.db
rm -rf dist

# Reinstall everything
npm install
npm run db:generate
npm run db:push
npm run db:test
```

---

## 📊 SUCCESS CRITERIA

✅ **Phase 1, Task 1 is COMPLETE when:**
1. All test commands run without errors
2. Test suite shows "ALL TESTS PASSED!"
3. Database file exists and is accessible
4. Prisma Studio can open and display tables
5. All CRUD operations work correctly

---

## 🎯 WHAT'S NEXT

After successful completion:
1. Integrate database with Phaser game engine
2. Create NPC spawning system
3. Implement daily cycle triggers
4. Build resource management UI

---

**Estimated Total Time:** 30-60 minutes  
**Last Updated:** November 5, 2025  
**Status:** Ready for Claude Code execution
