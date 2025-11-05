// dev-server.ts - Simple API for browser mode development
import express from "express";
import cors from "cors";
import { getDatabase } from "./database";

const app = express();
const PORT = 3001;

// Enable CORS for browser access
app.use(cors());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "VibeMaster Dev Server Running" });
});

// Get world state (same format as Tauri command)
app.get("/api/world-state", async (req, res) => {
  try {
    const db = getDatabase();

    const world = await db.world.findFirst({
      include: {
        npcs: {
          select: {
            id: true,
            name: true,
            occupation: true,
            needFood: true,
            needSafety: true,
            needWealth: true,
            emotionHappiness: true,
            emotionFear: true,
            emotionSadness: true,
            goals: {
              where: {
                completed: false,
                failed: false,
              },
              orderBy: { priority: "desc" },
              take: 3,
              select: {
                type: true,
                priority: true,
                urgent: true,
                desperate: true,
              },
            },
          },
        },
      },
    });

    if (world) {
      const result = {
        currentDay: world.currentDay,
        currentHour: world.currentHour,
        npcs: world.npcs,
      };

      res.json(result);
    } else {
      res.status(404).json({ error: "No world found" });
    }
  } catch (error) {
    console.error("Error fetching world state:", error);
    res.status(500).json({ error: "Failed to fetch world state" });
  }
});

// Start/stop simulation (stub for browser mode)
app.post("/api/simulation/start", (req, res) => {
  res.json({
    success: true,
    message:
      "In browser mode, simulation runs in separate terminal (npm run dev)",
  });
});

app.post("/api/simulation/stop", (req, res) => {
  res.json({
    success: true,
    message: "In browser mode, use Ctrl+C in simulation terminal to stop",
  });
});

app.listen(PORT, () => {
  console.log("🌐 VibeMaster Dev Server");
  console.log("================================");
  console.log(`✅ Running on http://localhost:${PORT}`);
  console.log("");
  console.log("📡 Endpoints:");
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/api/world-state`);
  console.log("");
  console.log("💡 Usage:");
  console.log("   1. Run simulation: npm run dev (in another terminal)");
  console.log("   2. Run this server: npm run dev:server");
  console.log("   3. Run Phaser game: npm run vite:dev");
  console.log("");
  console.log("   Browser mode will fetch live data from this server!");
  console.log("");
  console.log("📊 Data includes:");
  console.log("   - NPC names, occupations");
  console.log("   - Needs (food, safety, wealth)");
  console.log("   - Emotions (happiness, fear, sadness)");
  console.log("   - Active goals (up to 3 per NPC)");
});
