# 🚀 SETUP INSTRUCTIONS FOR CLAUDE CODE

Copy these commands and files to Claude Code to get the simulation running.

## Step 1: Create Project Directory

```bash
mkdir vibemaster-simulation
cd vibemaster-simulation
```

## Step 2: Copy All Files

You have all the files in `/mnt/user-data/outputs/`. Copy them into your project with this structure:

```
vibemaster-simulation/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
├── prisma/
│   └── schema.prisma
└── src/
    ├── types.ts
    ├── database.ts
    ├── index.ts
    ├── seed.ts
    └── simulation/
        ├── NPC.ts
        └── WorldSimulation.ts
```

## Step 3: Install Dependencies

```bash
npm install
```

Expected output:
```
added 150 packages in 15s
```

## Step 4: Set Up Environment

```bash
cp .env.example .env
```

The default `.env` content is fine:
```
DATABASE_URL="file:./dev.db"
```

## Step 5: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Create database with migrations
npx prisma migrate dev --name init

# Seed with test data
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

World ID: [some-id]
Marcus ID: [some-id]
Sarah ID: [some-id]
Emma ID: [some-id]
```

## Step 6: Run the Simulation

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
...
```

## Step 7: Stop the Simulation

Press `Ctrl+C` to stop.

## ✅ Success Criteria

You know it's working when you see:
- ✅ NPCs with changing needs (food decreases over time)
- ✅ NPCs creating goals when needs are low
- ✅ NPCs executing actions (seeking food, shelter, etc.)
- ✅ Emotions updating based on needs
- ✅ Status updates every 6 hours
- ✅ Time advancing (Day X, Hour Y)

## 🐛 Common Issues

### Issue: "No world found"
**Solution:** Run `npm run db:seed`

### Issue: Prisma errors
**Solution:** 
```bash
rm -f prisma/dev.db
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

### Issue: TypeScript errors
**Solution:**
```bash
npm install
npx prisma generate
```

### Issue: Port already in use
**Solution:** This doesn't use a port - it just runs in terminal. Make sure you don't have another instance running.

## 🎯 What to Report Back

Once running, let me know:

1. **Did it start?** (Yes/No)
2. **Any errors?** (Copy full error if any)
3. **Sample output** (Copy a few status updates)
4. **What you see** (Are NPCs acting? Goals changing? Needs decreasing?)

Then we can iterate and add more features!

## 📊 Optional: View Database

While simulation is running (or stopped), open another terminal:

```bash
cd vibemaster-simulation
npx prisma studio
```

This opens a web UI at `http://localhost:5555` where you can see:
- All NPCs and their current state
- Goals and their priorities
- Relationships between NPCs
- Memories
- Events

Very useful for debugging!

## 🎉 Next Steps After It Works

Once you confirm it's running, we'll add:
- More complex NPC behaviors
- NPC-to-NPC interactions
- Event detection system
- Dramatic moment identification
- Then connect to Claude for narrative generation!

---

**Ready?** Copy all the files, run the commands, and report back! 🚀
