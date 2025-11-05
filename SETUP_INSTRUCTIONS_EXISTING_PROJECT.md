# 🚀 SETUP INSTRUCTIONS - EXISTING PROJECT

You already have a VibeMaster project with the web app. These instructions will ADD the simulation engine without breaking anything.

## ✅ **What You Have**
- ✅ vibemaster-studio.html (web app)
- ✅ Documentation .md files
- ✅ Basic package.json (for web app)

## 🎯 **What We're Adding**
- Simulation engine (TypeScript)
- Database (SQLite + Prisma)
- NPC AI system

---

## 📋 **Step-by-Step Setup**

### Step 1: Replace package.json

Your current package.json is simple (just live-server). Replace it with the merged version:

**File: `package.json`** (replace entire file)
```json
{
  "name": "vibemaster",
  "version": "1.0.0",
  "description": "VibeMaster - Voice-driven game content creation and living world simulation",
  "main": "dist/index.js",
  "scripts": {
    "web": "live-server --port=5500",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx src/seed.ts",
    "test": "echo \"No tests yet\" && exit 0"
  },
  "keywords": ["gamedev", "voice", "ai", "decentraland", "simulation", "narrative"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "live-server": "^1.2.2",
    "prisma": "^5.7.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

**Note:** Your web app command changed from `npm start` → `npm run web`

---

### Step 2: Verify File Structure

Make sure you have these files (you should already have them extracted):

```
vibemaster/
├── vibemaster-studio.html          ✅ existing
├── VIBEMASTER_*.md                  ✅ existing
├── package.json                     🔄 REPLACED in step 1
├── tsconfig.json                    ✅ new (already extracted)
├── .env.example                     ✅ new (already extracted)
├── .gitignore                       ✅ new (already extracted)
├── README.md                        ✅ new (already extracted)
├── prisma/
│   └── schema.prisma               ✅ new (already extracted)
└── src/
    ├── types.ts                     ✅ new (already extracted)
    ├── database.ts                  ✅ new (already extracted)
    ├── index.ts                     ✅ new (already extracted)
    ├── seed.ts                      ✅ new (already extracted)
    └── simulation/
        ├── NPC.ts                   ✅ new (already extracted)
        └── WorldSimulation.ts       ✅ new (already extracted)
```

---

### Step 3: Install Dependencies

```bash
npm install
```

This will install:
- TypeScript & tsx (for running simulation)
- Prisma (database)
- live-server (your existing web app server)
- Other utilities

Expected output:
```
added 150+ packages in 15-30s
```

---

### Step 4: Create .env File

```bash
cp .env.example .env
```

This creates a `.env` file with:
```
DATABASE_URL="file:./prisma/dev.db"
```

**Note:** If you later add API keys (Claude, ElevenLabs), add them to this same .env file.

---

### Step 5: Initialize Database

```bash
# Generate Prisma client (creates TypeScript types)
npx prisma generate

# Create database and run migrations
npx prisma migrate dev --name init

# Seed with test data (Marcus, Sarah, Emma)
npm run db:seed
```

Expected output from seed:
```
🌱 Seeding database...
✅ Created world: Test Village
✅ Created 3 locations
✅ Created 3 NPCs
✅ Created relationships
✅ Created initial goals
✅ Created player

🎉 Seeding complete!
```

---

### Step 6: Test Simulation

```bash
npm run dev
```

Expected output:
```
🎮 VibeMaster Simulation Engine
================================

🌍 Loading world: Test Village
📅 Current time: Day 1, Hour 8:00

🌍 Initializing world simulation...
✅ Loaded 3 NPCs
▶️  Starting simulation... (Press Ctrl+C to stop)

⏰ Day 1, Hour 8:00
💡 Marcus is hungry! Created survival goal.
📊 NPC STATUS:
  Marcus: F:68 S:90 W:60 | 😊60 😰30 😢20 | [survival]
  Sarah: F:83 S:80 W:40 | 😊75 😰10 😢10 | [knowledge]
  Emma: F:88 S:85 W:55 | 😊70 😰15 😢15 | [idle]

⏰ Day 1, Hour 9:00
🎬 Marcus executes action: seek_food
  🍞 Marcus found food (+45)
```

Press `Ctrl+C` to stop.

---

### Step 7: Test Web App (Optional)

Your web app still works! In a separate terminal:

```bash
npm run web
```

This opens vibemaster-studio.html in your browser at `http://localhost:5500`

---

## 🎯 **Both Systems Now Work!**

You now have TWO systems running:

### 1️⃣ **Web App (Voice Studio)**
```bash
npm run web
# Opens vibemaster-studio.html
# Voice → JSON content creation
```

### 2️⃣ **Simulation Engine**
```bash
npm run dev
# Runs living world simulation
# NPCs with AI, needs, emotions, goals
```

---

## 📊 **Available Commands**

```bash
# Web App
npm run web          # Start web server for vibemaster-studio.html

# Simulation
npm run dev          # Run simulation (auto-restart on changes)
npm run build        # Build TypeScript to JavaScript
npm start            # Run built simulation

# Database
npm run db:generate  # Regenerate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open database viewer (http://localhost:5555)
npm run db:seed      # Populate test data

# Development
npm test             # Run tests (none yet)
```

---

## 🐛 **Troubleshooting**

### "Cannot find module @prisma/client"
```bash
npm run db:generate
```

### "No world found"
```bash
npm run db:seed
```

### Database errors
```bash
# Clean restart
rm -f prisma/dev.db
npm run db:migrate
npm run db:seed
```

### Web app not working
```bash
# Make sure you're using the new command
npm run web
# (not npm start anymore)
```

---

## ✅ **Success Criteria**

You know setup worked if:

1. ✅ `npm install` completes without errors
2. ✅ `npx prisma generate` creates client
3. ✅ `npx prisma migrate dev` creates database
4. ✅ `npm run db:seed` populates test data
5. ✅ `npm run dev` shows simulation running
6. ✅ NPCs have changing needs, create goals, take actions
7. ✅ `npm run web` still opens your HTML app

---

## 📝 **What to Report Back**

After running these steps, tell me:

1. **Did all commands succeed?** (Yes/No)
2. **Any errors?** (Copy full error message)
3. **Sample simulation output** (Copy 10-20 lines)
4. **Can you see NPCs acting?** (Getting hungry, seeking food, etc.)
5. **Does web app still work?** (npm run web)

Then we'll add more features! 🚀

---

## 🎉 **Next Steps After Success**

Once confirmed working:
- Add NPC-to-NPC interactions
- Add event detection
- Add relationship changes
- Connect to Claude for narrative generation
- Integrate with your web app UI

**Your two systems will work together:**
- Web app creates content (voice → JSON)
- Simulation brings it to life (living NPCs)
- Combined = full VibeMaster experience!
