# 🎮 VibeMaster Simulation Engine

Living world simulation with AI-driven NPCs for emergent narrative generation.

## 📋 What This Does

This is the **simulation engine** for VibeMaster. It creates a living world where:
- NPCs have needs, emotions, goals, and personalities
- NPCs autonomously make decisions and take actions
- The world evolves in real-time
- Events emerge naturally from NPC interactions
- Everything is tracked in a database for narrative generation

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env if needed (default SQLite settings work fine)
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates the database)
npm run db:migrate

# Seed with test data
npm run db:seed
```

### 4. Run the Simulation

```bash
npm run dev
```

You should see:
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

## 📊 What's Happening

The simulation runs in **ticks** (1 tick = 1 hour in-game):

1. **Needs decay** - NPCs get hungry, lonely, etc.
2. **Emotions update** - Based on needs and events
3. **Goals evaluated** - NPCs create new goals based on needs
4. **Actions executed** - NPCs work toward their top goal
5. **Time advances** - Clock moves forward

Every 6 hours, you get a status update showing:
- **Needs**: `F:70` (Food), `S:90` (Safety), `W:60` (Wealth)
- **Emotions**: `😊60` (Happy), `😰30` (Fear), `😢20` (Sad)
- **Current Goal**: `[survival]` (what they're working on)

## 🎯 Current Test NPCs

### Marcus (Blacksmith)
- **Personality**: Gruff, hardworking, protective
- **Values**: Family, honesty, hard work
- **Relationship**: Sarah is his daughter (love: 100)

### Sarah (Herbalist)
- **Personality**: Kind, curious, optimistic
- **Values**: Helping others, knowledge, nature
- **Relationship**: Marcus's daughter

### Emma (Baker)
- **Personality**: Warm, nurturing, community-focused
- **Values**: Community, tradition, kindness

## 🛠️ Development Commands

```bash
# Development (auto-restart on changes)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Database commands
npm run db:generate    # Regenerate Prisma client
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio (visual DB editor)
npm run db:seed        # Populate test data

# Clean start
rm -f prisma/dev.db    # Delete database
npm run db:migrate     # Recreate
npm run db:seed        # Repopulate
npm run dev            # Run
```

## 📁 Project Structure

```
vibemaster-simulation/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── dev.db             # SQLite database (created after migration)
├── src/
│   ├── simulation/
│   │   ├── NPC.ts         # NPC AI logic
│   │   └── WorldSimulation.ts  # Main simulation loop
│   ├── types.ts           # TypeScript types
│   ├── database.ts        # DB connection utilities
│   ├── seed.ts            # Test data generator
│   └── index.ts           # Entry point
├── package.json
├── tsconfig.json
└── .env                   # Your config (not in git)
```

## 🎮 Simulation Configuration

Edit in `src/index.ts`:

```typescript
const simulation = new WorldSimulation(db, world.id, {
  tickSpeed: 2000,        // Milliseconds per tick (2s = 1 in-game hour)
  autoSaveInterval: 10,   // Auto-save every N ticks
  enableLogging: true,
  logLevel: 'info'        // 'debug' | 'info' | 'warn' | 'error'
});
```

## 🔍 Exploring the Database

```bash
npm run db:studio
```

This opens Prisma Studio in your browser where you can:
- View all NPCs, their needs, emotions, goals
- See relationships between NPCs
- Browse events and memories
- Edit data manually for testing

## 📝 Next Steps

### Phase 1 Complete ✅
- [x] Database schema
- [x] NPC needs system
- [x] Basic emotion system
- [x] Goal evaluation
- [x] Action execution
- [x] Simulation loop

### Phase 2: Advanced AI (Next)
- [ ] NPC schedules (work, sleep, socialize)
- [ ] Location-aware behavior
- [ ] NPC-to-NPC interactions
- [ ] Relationship changes from events
- [ ] More complex goal planning
- [ ] Event detection system

### Phase 3: Narrative Integration
- [ ] Context builder (extract state for prompts)
- [ ] Claude integration
- [ ] Ink dialogue generation
- [ ] Conversation system

### Phase 4: Game Integration
- [ ] Web UI to observe simulation
- [ ] Player interaction system
- [ ] Quest system
- [ ] Save/load games

## 🐛 Troubleshooting

**"No world found" error:**
```bash
npm run db:seed
```

**Database schema changed:**
```bash
npm run db:migrate
npm run db:seed
```

**TypeScript errors:**
```bash
npm run db:generate  # Regenerate Prisma types
```

**Simulation too fast/slow:**
Edit `tickSpeed` in `src/index.ts` (in milliseconds)

## 🎉 What to Watch For

As the simulation runs, you'll see **emergent behaviors**:

- NPCs getting hungry and seeking food
- NPCs creating urgent goals when needs are critical
- Emotions changing based on needs
- Desperation increasing when multiple needs are low
- (More complex behaviors coming in Phase 2!)

This is just the foundation. The magic happens when we add:
- NPC interactions (Phase 2)
- Narrative generation (Phase 3)
- Player integration (Phase 4)

## 📚 Documentation

See the project knowledge files for full architecture:
- `VIBEMASTER_NARRATIVE_ARCHITECTURE.md` - How narrative generation works
- `VIBEMASTER_NARRATIVE_IMPLEMENTATION.md` - Code patterns
- `VIBEMASTER_INK_INTEGRATION.md` - Dialogue system
- `living_world_simulation_foundation` - Original simulation design

---

**Status:** ✅ Phase 1 Complete - Basic Simulation Working  
**Next:** Phase 2 - Advanced NPC AI & Interactions
