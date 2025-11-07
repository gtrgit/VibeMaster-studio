import Phaser from "phaser";
import {
  SPRITE_CONFIG,
  getNPCSpriteFrame,
  printSpriteLayout,
} from "./sprite-config";
import {
  ResourceManager,
  PRODUCTION_RECIPES,
} from "./resource-system-with-logging";
import {
  ResourcePanel,
  ProductionIndicator,
  StorageBuilding,
} from "./resource-ui";
import { LocationSystem } from "./location-system";
import { DailyCycleSystem } from "./daily-cycle-system";
import { NPCBehaviorState } from "./need-based-behavior";
import { 
  NPC_PERSONALITIES, 
  getPersonalityGreeting, 
  getPersonalityWellbeingResponse,
  getPersonalityOccupationResponse 
} from "./personality-system";
import { 
  detectCrisis, 
  getCrisisDialogueOptions,
  shouldInterruptForCrisis 
} from "./crisis-system";
import { LocationCrisisSystem, CRISIS_ZONES } from "./location-crisis-system";

// Simple runtime check for Tauri without type issues
const isTauri =
  typeof window !== "undefined" && (window as any).__TAURI__ !== undefined;

// Dev server URL for browser mode
const DEV_SERVER_URL = "http://localhost:3001";

// Helper function to safely call Tauri commands
async function callTauriCommand(command: string): Promise<string> {
  if (!isTauri) {
    throw new Error("Tauri commands only available in desktop mode");
  }

  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.tauri?.invoke) {
      return await tauri.tauri.invoke(command);
    }
    throw new Error("Tauri invoke not available");
  } catch (e) {
    throw new Error(`Failed to call Tauri command: ${e}`);
  }
}

// Helper function to fetch from dev server (browser mode)
async function fetchFromDevServer(endpoint: string): Promise<any> {
  const response = await fetch(`${DEV_SERVER_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Dev server error: ${response.statusText}`);
  }
  return response.json();
}

// Get sprite tint based on NPC state
function getNPCTint(npc: any): number {
  const avgNeed = (npc.needFood + npc.needSafety) / 2;

  if (avgNeed < 30) return 0xff6666; // Critical - red
  if (avgNeed < 60) return 0xffff88; // Warning - yellow
  return 0xffffff; // Healthy - normal
}

// Get emoji for goal type
function getGoalEmoji(goalType: string): string {
  const goalEmojis: { [key: string]: string } = {
    survival: "🍽️",
    safety: "🛡️",
    wealth: "💰",
    social: "👥",
    knowledge: "📖",
    rescue: "🆘",
    explore: "🗺️",
    build: "🏗️",
    trade: "🤝",
    default: "💭",
  };

  return goalEmojis[goalType] || goalEmojis.default;
}

class GameScene extends Phaser.Scene {
  private statusText?: Phaser.GameObjects.Text;
  private npcInfoText?: Phaser.GameObjects.Text;
  private npcInfoPanel?: Phaser.GameObjects.Container;
  private worldData: any = null;
  private npcSprites: Map<
    string,
    {
      sprite: Phaser.GameObjects.Sprite;
      nameText: Phaser.GameObjects.Text;
      goalText?: Phaser.GameObjects.Text;
      emotionIcon?: Phaser.GameObjects.Text;
      barBg: Phaser.GameObjects.Rectangle;
      barFill: Phaser.GameObjects.Rectangle;
    }
  > = new Map();
  private devServerConnected: boolean = false;

  // Conversation system
  private conversationPanel?: Phaser.GameObjects.Container;
  private isInConversation: boolean = false;
  private currentConversationNPC?: any;
  
  // Track currently displayed NPC for auto-updating info panel
  private currentDisplayedNPC?: any;
  
  // Testing mode - disable automatic need changes
  private testingMode: boolean = false;

  // Resource system
  private resourceManager!: ResourceManager;
  private resourcePanel!: ResourcePanel;
  private productionIndicator!: ProductionIndicator;
  private storageBuildings: StorageBuilding[] = [];
  private lastHour: number = -1;

  // Daily cycle system
  private locationSystem!: LocationSystem;
  private cycleSystem!: DailyCycleSystem;
  
  // Location crisis system
  private locationCrisisSystem!: LocationCrisisSystem;
  private crisisZoneGraphics: Phaser.GameObjects.Graphics[] = [];
  private lastPlayerPosition: { x: number; y: number } = { x: -1, y: -1 };
  
  // Building graphics
  private buildingGraphics: Phaser.GameObjects.Graphics[] = [];
  private buildingTexts: Phaser.GameObjects.Text[] = [];

  // Test: Add ALL player properties
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private playerSpeed: number = 150;

  constructor() {
    super("GameScene");
  }

  preload() {
    console.log("🎨 Loading sprites with configuration:");
    console.log(`  File: ${SPRITE_CONFIG.fileName}`);
    console.log(
      `  Sprite size: ${SPRITE_CONFIG.spriteWidth}x${SPRITE_CONFIG.spriteHeight}`
    );
    console.log(
      `  Sheet layout: ${SPRITE_CONFIG.columns} columns × ${SPRITE_CONFIG.rows} rows`
    );
    console.log(
      `  Total sprites: ${SPRITE_CONFIG.columns * SPRITE_CONFIG.rows}`
    );
    console.log(`  Display scale: ${SPRITE_CONFIG.displayScale}x`);

    // Load sprite sheet with configured dimensions
    this.load.spritesheet("characters", `assets/${SPRITE_CONFIG.fileName}`, {
      frameWidth: SPRITE_CONFIG.spriteWidth,
      frameHeight: SPRITE_CONFIG.spriteHeight,
    });

    // Print full sprite layout to console (useful for debugging)
    printSpriteLayout();
  }

  initResourceSystem(): void {
    console.log("🏭 Initializing resource system...");

    // Create resource manager
    this.resourceManager = new ResourceManager();

    // Create storage locations
    this.resourceManager.createStorage(
      "warehouse",
      "Warehouse",
      "🏚️",
      100,
      1200,
      300
    );

    this.resourceManager.createStorage("market", "Market", "🏪", 80, 1200, 500);

    this.resourceManager.createStorage("armory", "Armory", "🏰", 50, 1200, 700);

    // Add PLENTY of initial resources so NPCs can work
    const warehouse = this.resourceManager.getStorage("warehouse");
    if (warehouse) {
      console.log("📦 Adding initial resources to warehouse...");
      warehouse.add("wood", 30);
      warehouse.add("stone", 20);
      warehouse.add("iron", 15);
      warehouse.add("food", 40);
      console.log("   ✅ Added: 30 wood, 20 stone, 15 iron, 40 food");
    }

    // Create UI components
    this.resourcePanel = new ResourcePanel(this, 950, 50);
    this.productionIndicator = new ProductionIndicator(this);

    // Create storage building visuals
    for (const storage of this.resourceManager.getAllStorages()) {
      const building = new StorageBuilding(
        this,
        storage,
        storage.x,
        storage.y,
        (clickedStorage) => this.onStorageClick(clickedStorage)
      );
      this.storageBuildings.push(building);
    }

    // Log initial state
    this.resourceManager.logStorageState();

    console.log("✅ Resource system initialized!\n");
  }

  initDailyCycleSystem(): void {
    console.log("🌅 Initializing daily cycle system...");

    // Create location and cycle systems
    this.locationSystem = new LocationSystem();
    this.cycleSystem = new DailyCycleSystem(this.locationSystem);

    // Register mock NPCs with behavior system
    const mockNPCs = this.getMockData().npcs;

    for (const npc of mockNPCs) {
      const behaviorNPC: NPCBehaviorState = {
        name: npc.name,
        occupation: npc.occupation,
        needFood: npc.needFood || 80,
        needSafety: npc.needSafety || 85,
        needWealth: npc.needWealth || 50,
        needSocial: 60, // New need
        needRest: 70, // New need
        currentLocation: "",
        currentActivity: "idle",
        home: "",
        workplace: "",
      };

      this.cycleSystem.registerNPC(behaviorNPC);
    }

    // Show location setup
    this.locationSystem.logLocations();

    console.log("✅ Daily cycle system initialized!\n");
  }

  initLocationCrisisSystem(): void {
    console.log("⚠️ Initializing location crisis system...");
    
    // Create crisis system instance
    this.locationCrisisSystem = new LocationCrisisSystem();
    
    // Create visual indicators for crisis zones
    this.renderCrisisZones();
    
    console.log(`   📍 Created ${CRISIS_ZONES.length} crisis zones`);
    console.log("✅ Location crisis system initialized!\n");
  }
  
  renderCrisisZones(): void {
    // Clear existing graphics
    this.crisisZoneGraphics.forEach(g => g.destroy());
    this.crisisZoneGraphics = [];
    
    // Get zone visuals from the system
    const zoneVisuals = this.locationCrisisSystem.getZoneVisuals();
    
    for (const { zone, color, alpha } of zoneVisuals) {
      const graphics = this.add.graphics();
      
      // Draw zone rectangle
      graphics.fillStyle(color, alpha);
      graphics.fillRect(zone.x, zone.y, zone.width, zone.height);
      
      // Draw border
      graphics.lineStyle(2, color, 0.8);
      graphics.strokeRect(zone.x, zone.y, zone.width, zone.height);
      
      // Draw effect radius circle (dotted)
      const centerX = zone.x + zone.width / 2;
      const centerY = zone.y + zone.height / 2;
      graphics.lineStyle(1, color, 0.4);
      
      // Draw dotted circle for effect radius
      const segments = 32;
      for (let i = 0; i < segments; i += 2) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        const x1 = centerX + Math.cos(angle1) * zone.effectRadius;
        const y1 = centerY + Math.sin(angle1) * zone.effectRadius;
        const x2 = centerX + Math.cos(angle2) * zone.effectRadius;
        const y2 = centerY + Math.sin(angle2) * zone.effectRadius;
        graphics.lineBetween(x1, y1, x2, y2);
      }
      
      // Add zone name text
      const text = this.add.text(
        centerX,
        centerY,
        `${zone.name}\n(${zone.effectRadius}px radius)`,
        {
          fontSize: "12px",
          color: "#fff",
          backgroundColor: "#00000099",
          padding: { x: 4, y: 2 },
          align: "center"
        }
      );
      text.setOrigin(0.5);
      text.setDepth(1);
      
      this.crisisZoneGraphics.push(graphics);
    }
  }

  createNPCInfoPanel(): void {
    // Create container for the NPC info panel
    this.npcInfoPanel = this.add.container(20, 60);
    this.npcInfoPanel.setDepth(100);

    // Background
    const bg = this.add.rectangle(0, 0, 380, 400, 0x000000, 0.8);
    bg.setOrigin(0, 0);
    this.npcInfoPanel.add(bg);

    // Initial text
    this.npcInfoText = this.add.text(10, 10, "Click an NPC to see their info\n\nStats will update in real-time\nwhen viewing NPC details", {
      fontSize: "16px",
      color: "#fff",
      wordWrap: { width: 360 },
    });
    this.npcInfoPanel.add(this.npcInfoText);
  }

  updateNPCStatValue(statName: string, change: number): void {
    if (!this.currentDisplayedNPC) return;

    // Enable testing mode when manually adjusting stats
    this.testingMode = true;

    // Find the NPC in world data
    const worldNPC = this.worldData?.npcs?.find((n: any) => n.name === this.currentDisplayedNPC.name);
    if (!worldNPC) return;

    // Update the stat in world data
    const newValue = Math.max(0, Math.min(100, worldNPC[statName] + change));
    worldNPC[statName] = newValue;
    this.currentDisplayedNPC[statName] = newValue;

    // Also update behavior NPC if this is a social/rest stat
    const behaviorNPC = this.cycleSystem.getNPC(this.currentDisplayedNPC.name);
    if (behaviorNPC && (statName === 'needSocial' || statName === 'needRest')) {
      behaviorNPC[statName] = newValue;
    }

    // Show floating text effect on the NPC
    const npcVisual = this.npcSprites.get(this.currentDisplayedNPC.name);
    if (npcVisual) {
      const displayName = statName.replace('need', '').replace('emotion', '');
      const effectText = `${displayName} ${change > 0 ? '+' : ''}${change}`;
      this.showNPCEffectText(npcVisual.sprite, [effectText]);
    }

    // Refresh the info display
    this.generateNPCInfoText(this.currentDisplayedNPC);
  }

  onStorageClick(storage: any): void {
    console.log("Clicked storage:", storage.name);

    // Clear displayed NPC when showing storage info
    this.currentDisplayedNPC = undefined;

    let info = `🏢 ${storage.name}\n\n`;
    info += `Capacity: ${storage.getTotalStored()}/${storage.capacity}\n`;
    info += `Fill: ${storage.getFillPercent().toFixed(1)}%\n\n`;

    if (storage.inventory.size > 0) {
      info += `Inventory:\n`;
      for (const [resource, amount] of storage.inventory.entries()) {
        info += `  ${amount}x ${resource}\n`;
      }
    } else {
      info += `(Empty)`;
    }

    // Show storage info in the NPC info area  
    if (this.npcInfoPanel && this.npcInfoText) {
      this.npcInfoPanel.removeAll(true);
      
      // Background
      const bg = this.add.rectangle(0, 0, 380, 300, 0x000000, 0.8);
      bg.setOrigin(0, 0);
      this.npcInfoPanel.add(bg);
      
      // Storage info text
      const storageText = this.add.text(10, 10, info, {
        fontSize: "16px",
        color: "#fff",
        wordWrap: { width: 360 }
      });
      this.npcInfoPanel.add(storageText);
    }
  }

  updateResourceSystem(currentHour: number): void {
    // Only update on hour change
    if (currentHour === this.lastHour) return;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🕐 HOUR ${currentHour} UPDATE`);
    console.log("=".repeat(60));

    // Update daily cycle system (handles checkpoints at 6, 12, 18, 22) - but only if not in testing mode
    if (!this.testingMode) {
      this.cycleSystem.onHourChange(currentHour);
    }

    // First, check what NPCs are thinking
    if (this.worldData?.npcs) {
      this.resourceManager.logNPCThoughts(this.worldData.npcs, currentHour);
    }

    // Then check for completed production
    const completed = this.resourceManager.updateProduction(currentHour);

    // Show visual feedback for completed tasks
    for (const task of completed) {
      const npcVisual = this.npcSprites.get(task.npcName);
      if (npcVisual) {
        this.productionIndicator.showProduction(
          task.npcName,
          npcVisual.sprite.x,
          npcVisual.sprite.y,
          task.resource,
          task.amount
        );
      }
    }

    // Auto-assign production tasks to idle NPCs
    if (this.worldData?.npcs) {
      console.log(`\n🔄 === ASSIGNING NEW TASKS ===`);
      let assignedCount = 0;

      for (const npc of this.worldData.npcs) {
        const existingTask = this.resourceManager.getNPCTask(npc.name);
        if (
          !existingTask &&
          PRODUCTION_RECIPES[npc.occupation?.toLowerCase()]
        ) {
          // Get NPC's current location and workplace from behavior system
          const behaviorNPC = this.cycleSystem.getNPC(npc.name);
          const currentLocation = behaviorNPC?.currentLocation;
          const workplace = behaviorNPC?.workplace;

          const task = this.resourceManager.startProduction(
            npc.name,
            npc.occupation,
            currentHour,
            "warehouse",
            currentLocation,
            workplace
          );

          if (task) {
            assignedCount++;
          }
        }
      }

      if (assignedCount > 0) {
        console.log(`\n✅ Assigned ${assignedCount} new task(s)`);
      } else {
        console.log(
          `\n⏸️  No new tasks assigned (NPCs working or missing materials)`
        );
      }
    }

    // Log current storage state
    this.resourceManager.logStorageState();

    // Update UI
    this.resourcePanel.update(this.resourceManager);

    this.lastHour = currentHour;
    console.log(`\n${"=".repeat(60)}\n`);
  }

  async create() {
    console.log("🎬 NEW CODE: Starting create() method with player support...");
    console.log("🔍 Tauri detection: isTauri =", isTauri);
    console.log("🔍 Window.__TAURI__:", typeof (window as any).__TAURI__);
    
    // Initialize resource system FIRST
    console.log("🏭 About to init resource system...");
    this.initResourceSystem();
    console.log("✅ Resource system initialized");

    // Initialize daily cycle system SECOND
    console.log("🌅 About to init daily cycle system...");
    this.initDailyCycleSystem();
    console.log("✅ Daily cycle system initialized");
    
    // Initialize location crisis system THIRD
    console.log("⚠️ About to init location crisis system...");
    this.initLocationCrisisSystem();
    console.log("✅ Location crisis system initialized");
    
    // Initialize buildings FOURTH
    console.log("🏠 About to render buildings...");
    this.renderBuildings();
    console.log("✅ Buildings rendered");

    // Create background
    console.log("🎨 About to create background...");
    this.createBackground();
    console.log("✅ Background created");

    // Create player
    console.log("🔵 About to call createPlayer...");
    this.createPlayer();
    console.log("✅ createPlayer call completed");

    // Removed title to make room for horizontal stats

    // Create horizontal status bar at top
    const statusBarY = 10;
    
    // Status display (now horizontal at top-left)
    this.statusText = this.add.text(20, statusBarY, "Loading...", {
      fontSize: "14px",
      color: "#fff",
      backgroundColor: "#00000088",
      padding: { x: 8, y: 4 },
    });
    
    // Mode indicator (top-right)
    const mode = isTauri ? "🖥️ Desktop Mode" : "🌐 Browser Mode";
    const modeText = this.add.text(1400, statusBarY, mode, {
      fontSize: "14px",
      color: "#888",
      backgroundColor: "#00000088",
      padding: { x: 8, y: 4 },
    });

    // Server status (top-right, below mode)
    if (!isTauri) {
      try {
        await fetchFromDevServer("/health");
        this.devServerConnected = true;
        this.add.text(1400, statusBarY + 30, "✅ Server OK", {
          fontSize: "14px",
          color: "#4f4",
          backgroundColor: "#00000088",
          padding: { x: 8, y: 4 },
        });
      } catch (e) {
        this.devServerConnected = false;
        this.add.text(1400, statusBarY + 30, "⚠️ Using Mock Data", {
          fontSize: "14px",
          color: "#f90",
          backgroundColor: "#00000088",
          padding: { x: 8, y: 4 },
        });
        console.log("ℹ️ Dev server not available. Using mock data. Run 'npm run dev:server' for live data.");
      }
    }

    // NPC Info display (interactive panel in top-left)
    this.createNPCInfoPanel();

    // Controls
    this.createControls();

    // Legend
    this.add.text(
      20,
      950,
      "💡 WASD/Arrows: Move Player | Click NPC for details | Click storage to inspect | Middle-click drag to pan",
      {
        fontSize: "12px",
        color: "#888",
      }
    );

    // Camera controls
    this.cameras.main.setBounds(0, 0, 1600, 1000);

    // Pan with middle mouse button
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown()) {
        this.cameras.main.scrollX -= pointer.velocity.x / 20;
        this.cameras.main.scrollY -= pointer.velocity.y / 20;
      }
    });

    // Update world state every second
    this.time.addEvent({
      delay: 1000,
      callback: () => this.updateWorld(),
      callbackScope: this,
      loop: true,
    });

    // Initial load
    this.updateWorld();
  }

  createBackground() {
    // Simple tiled background
    const tileSize = 32;
    const cols = Math.ceil(1600 / tileSize);
    const rows = Math.ceil(1000 / tileSize);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const color = (x + y) % 2 === 0 ? 0x2a3a2a : 0x253525;
        this.add.rectangle(
          x * tileSize + tileSize / 2,
          y * tileSize + tileSize / 2,
          tileSize,
          tileSize,
          color
        );
      }
    }
  }

  createPlayer() {
    // Create player sprite at center of world (using a different frame than NPCs)
    this.player = this.add.sprite(800, 500, "characters", 0)
      .setScale(SPRITE_CONFIG.displayScale)
      .setDepth(1000) // High depth so player is always on top
      .setTint(0x4444ff); // Blue tint to distinguish from NPCs

    // Set up keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    const wasdKeys = this.input.keyboard!.addKeys("W,S,A,D") as {
      W: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };
    
    // Map WASD to directional properties
    this.wasd = {
      up: wasdKeys.W,
      down: wasdKeys.S,
      left: wasdKeys.A,
      right: wasdKeys.D
    };

    // Camera follows player smoothly
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
  }

  createControls() {
    // Position buttons at bottom-left
    const yPos = 900;

    const startBtn = this.add
      .text(20, yPos, "▶️ Start", {
        fontSize: "18px",
        color: "#0f0",
        backgroundColor: "#333",
        padding: { x: 10, y: 5 },
      })
      .setInteractive();

    startBtn.on("pointerdown", async () => {
      try {
        if (isTauri) {
          await callTauriCommand("start_simulation");
          this.updateStatusBar();
        } else {
          console.log("ℹ️ Run: npm run dev");
        }
      } catch (e) {
        console.error("Start error:", e);
      }
    });

    const stopBtn = this.add
      .text(120, yPos, "⏸️ Stop", {
        fontSize: "18px",
        color: "#f00",
        backgroundColor: "#333",
        padding: { x: 10, y: 5 },
      })
      .setInteractive();

    stopBtn.on("pointerdown", async () => {
      try {
        if (isTauri) {
          await callTauriCommand("stop_simulation");
          this.updateStatusBar();
        } else {
          console.log("ℹ️ Ctrl+C in terminal");
        }
      } catch (e) {
        console.error("Stop error:", e);
      }
    });
  }

  async updateWorld() {
    try {
      if (isTauri) {
        const worldDataStr = await callTauriCommand("get_world_state");
        this.worldData = JSON.parse(worldDataStr);
      } else {
        if (this.devServerConnected) {
          try {
            this.worldData = await fetchFromDevServer("/api/world-state");
          } catch (e) {
            console.error("Dev server fetch failed:", e);
            this.worldData = this.getMockData();
          }
        } else {
          this.worldData = this.getMockData();
        }
      }

      if (this.worldData) {
        this.updateResourceSystem(this.worldData.currentHour);
        this.renderWorld();
      }
    } catch (e) {
      console.error("Failed to get world state:", e);
    }
  }

  getMockData() {
    // Cycle through hours every minute for testing
    const currentMinute = Math.floor(Date.now() / 60000);

    return {
      currentDay: 16,
      currentHour: currentMinute % 24, // Cycles 0-23
      npcs: [
        {
          name: "Marcus",
          occupation: "Blacksmith",
          needFood: 8,  // EXTREME starvation crisis (was 80)
          needSafety: 90,
          needWealth: 60,
          emotionHappiness: 31,
          emotionFear: 0,
          goals: [{ type: "survival", priority: 80 }],
        },
        {
          name: "Sarah",
          occupation: "Merchant",
          needFood: 44,
          needSafety: 15,  // HIGH danger crisis (was 80)
          needWealth: 5,   // Poverty crisis (was 40)
          emotionHappiness: 24,
          emotionFear: 0,
          goals: [{ type: "wealth", priority: 90 }],
        },
        {
          name: "Emma",
          occupation: "Baker",
          needFood: 73,
          needSafety: 85,
          needWealth: 55,
          emotionHappiness: 10,  // Emotional breakdown crisis (was 25)
          emotionFear: 0,
          goals: [],
        },
      ],
    };
  }

  renderWorld() {
    const { currentDay, currentHour, npcs } = this.worldData;

    // Update horizontal status bar
    const statusText = `📅 Day ${currentDay}, ${currentHour}:00 | 👥 ${npcs?.length || 0} NPCs | 📦 ${
      this.resourceManager.getSummary().length
    } resources | 🏭 ${
      this.resourceManager.getActiveTasks().length
    } working`;

    this.statusText?.setText(statusText);

    // Update NPC info panel if one is currently displayed
    this.updateNPCInfoDisplay();

    if (npcs && npcs.length > 0) {
      this.renderNPCs(npcs);
    }
  }

  renderNPCs(npcs: any[]) {
    if (!npcs || npcs.length === 0) return;

    // Use behavior-based positioning
    for (const npc of npcs) {
      // Get behavior state
      const behaviorNPC = this.cycleSystem.getNPC(npc.name);

      // Default position (circle layout for fallback)
      const index = npcs.indexOf(npc);
      const centerX = 600;
      const centerY = 400;
      const radius = 220;
      const angle = (index / npcs.length) * Math.PI * 2 - Math.PI / 2;
      let x = centerX + Math.cos(angle) * radius;
      let y = centerY + Math.sin(angle) * radius;

      // Use location if available
      if (behaviorNPC) {
        const location = this.locationSystem.getLocation(
          behaviorNPC.currentLocation
        );
        if (location) {
          x = location.x;
          y = location.y;

          // Offset for multiple NPCs at same location (no random jitter)
          const npcsAtLocation = this.cycleSystem.getNPCsAtLocation(
            behaviorNPC.currentLocation
          );
          const npcIndex = npcsAtLocation.findIndex((n) => n.name === npc.name);
          
          if (npcIndex > 0) {
            // Spread multiple NPCs in a small circle around the building
            const offsetAngle =
              (npcIndex / npcsAtLocation.length) * Math.PI * 2;
            x += Math.cos(offsetAngle) * 30; // Reduced from 80 to 30
            y += Math.sin(offsetAngle) * 30;
          }
        }
      }

      let npcVisual = this.npcSprites.get(npc.name);

      if (!npcVisual) {
        // Get frame number from sprite config
        const frame = getNPCSpriteFrame(npc.occupation);

        // Log for debugging
        console.log(
          `Creating sprite for ${npc.name} (${npc.occupation}) → Frame ${frame}`
        );

        // Create sprite with configured scale
        const sprite = this.add.sprite(x, y, "characters", frame);
        sprite.setScale(SPRITE_CONFIG.displayScale);

        // Make interactive
        sprite.setInteractive();
        sprite.on("pointerdown", () => this.onNPCClick(npc));
        sprite.on("pointerover", () => {
          sprite.setScale(SPRITE_CONFIG.displayScale * 1.2);
        });
        sprite.on("pointerout", () => {
          sprite.setScale(SPRITE_CONFIG.displayScale);
        });

        // Name label
        const nameText = this.add
          .text(x, y - 35, npc.name, {
            fontSize: "14px",
            color: "#fff",
            fontStyle: "bold",
            stroke: "#000",
            strokeThickness: 3,
          })
          .setOrigin(0.5);

        // Goal emoji
        const goalText = this.add
          .text(x, y - 50, "", {
            fontSize: "20px",
          })
          .setOrigin(0.5);

        // Emotion icon
        const emotionIcon = this.add
          .text(x + 25, y - 15, "", {
            fontSize: "16px",
          })
          .setOrigin(0.5);

        // Health bar
        const barBg = this.add.rectangle(x, y + 30, 60, 4, 0x333333);
        const barFill = this.add.rectangle(x, y + 30, 60, 4, 0x00ff00);

        npcVisual = { sprite, nameText, goalText, emotionIcon, barBg, barFill };
        this.npcSprites.set(npc.name, npcVisual);
      } else {
        // Update existing sprite
        npcVisual.sprite.setPosition(x, y);
        npcVisual.nameText.setPosition(x, y - 35);
        npcVisual.goalText?.setPosition(x, y - 50);
        npcVisual.emotionIcon?.setPosition(x + 25, y - 15);
        npcVisual.barBg.setPosition(x, y + 30);
        npcVisual.barFill.setPosition(x, y + 30);

        // Update frame if occupation changed
        npcVisual.sprite.setFrame(getNPCSpriteFrame(npc.occupation));
      }

      // Apply tint
      npcVisual.sprite.setTint(getNPCTint(npc));

      // Update goal
      if (npc.goals && npc.goals.length > 0) {
        npcVisual.goalText?.setText(getGoalEmoji(npc.goals[0].type));
      } else {
        npcVisual.goalText?.setText("");
      }

      // Show activity emoji if in behavior system
      if (behaviorNPC) {
        const activityEmojis: Record<string, string> = {
          working: "🔨",
          eating: "🍽️",
          socializing: "👥",
          resting: "😴",
          fleeing: "🏃",
          idle: "💭",
        };
        const activityEmoji = activityEmojis[behaviorNPC.currentActivity] || "";
        if (activityEmoji && npcVisual.goalText) {
          npcVisual.goalText.setText(activityEmoji);
        }
      }

      // Update emotion (0-50 = sad, 51-100 = happy)
      let emotionEmoji = "";
      if (npc.emotionHappiness < 25) emotionEmoji = "😢"; // Very sad
      else if (npc.emotionHappiness < 50) emotionEmoji = "😞"; // Sad
      else if (npc.emotionFear > 80) emotionEmoji = "😰"; // Fear overrides happiness
      else if (npc.emotionHappiness > 80) emotionEmoji = "😄"; // Very happy
      else if (npc.emotionHappiness > 60) emotionEmoji = "😊"; // Happy
      npcVisual.emotionIcon?.setText(emotionEmoji);

      // Update health bar
      const avgNeed = (npc.needFood + npc.needSafety) / 2;
      const barWidth = 60;
      const fillWidth = (avgNeed / 100) * barWidth;
      npcVisual.barFill.setDisplaySize(fillWidth, 4);
      npcVisual.barFill.x = x - (barWidth - fillWidth) / 2;

      let barColor: number;
      if (avgNeed > 70) barColor = 0x00ff00;
      else if (avgNeed > 40) barColor = 0xffaa00;
      else barColor = 0xff0000;
      npcVisual.barFill.setFillStyle(barColor);

      // Pulse if critical
      if (avgNeed < 30) {
        this.tweens.add({
          targets: npcVisual.sprite,
          scale: SPRITE_CONFIG.displayScale * 1.1,
          duration: 400,
          yoyo: true,
          repeat: 0,
        });
      }
    }
  }

  onNPCClick(npc: any) {
    console.log("Clicked NPC:", npc);
    
    // If already in conversation, close it and return
    if (this.isInConversation) {
      this.closeConversation();
      return;
    }

    // Start conversation instead of showing stats
    this.startConversation(npc);
  }
  
  startConversation(npc: any) {
    console.log("Starting conversation with:", npc.name);
    
    this.isInConversation = true;
    this.currentConversationNPC = npc;
    
    // Create simple conversation UI
    this.createSimpleConversationUI(npc);
  }

  createSimpleConversationUI(npc: any) {
    // Close existing conversation if any
    if (this.conversationPanel) {
      this.conversationPanel.destroy();
    }

    // Create container for conversation UI
    this.conversationPanel = this.add.container(0, 0);

    // Simple background panel
    const panelWidth = 600;
    const panelHeight = 400;
    const panelX = (1600 - panelWidth) / 2;
    const panelY = (1000 - panelHeight) / 2;

    const background = this.add.rectangle(
      panelX + panelWidth / 2,
      panelY + panelHeight / 2,
      panelWidth,
      panelHeight,
      0x000000,
      0.9
    );
    background.setStrokeStyle(3, 0x666666);

    // NPC greeting based on personality
    const personality = NPC_PERSONALITIES[npc.name];
    const greeting = personality 
      ? getPersonalityGreeting(npc, personality)
      : `${npc.name}: Hello there!`;
    
    const greetingText = this.add.text(panelX + 20, panelY + 20, greeting, {
      fontSize: "18px",
      color: "#fff",
      fontStyle: "bold",
      wordWrap: { width: panelWidth - 40 },
    });

    // Conversation options - check for crisis
    const crisis = detectCrisis(npc);
    let options: Array<{ text: string, callback: () => void }> = [];
    
    if (crisis && shouldInterruptForCrisis(crisis)) {
      // Crisis dialogue options
      const crisisOptions = getCrisisDialogueOptions(npc, crisis);
      options = crisisOptions.map(opt => ({
        text: opt.text,
        callback: () => this.handleCrisisResponse(npc, opt.action, crisis)
      }));
    } else {
      // Normal dialogue options
      options = [
        { text: "How are you doing?", callback: () => this.showWellbeingResponse(npc) },
        { text: "What do you do here?", callback: () => this.showOccupationResponse(npc) },
        { text: "Show NPC Info", callback: () => { this.closeConversation(); this.showNPCInfo(npc); } },
        { text: "Goodbye", callback: () => this.closeConversation() }
      ];
    }

    let buttonY = panelY + 150; // Moved down to give more space for greeting
    const buttons: Phaser.GameObjects.Text[] = [];
    
    options.forEach((option, index) => {
      const button = this.add.text(panelX + 20, buttonY + (index * 45), option.text, {
        fontSize: "16px",
        color: index === options.length - 1 ? "#f44" : "#4af",
        backgroundColor: "#333333",
        padding: { x: 10, y: 5 },
      });
      
      button.setInteractive();
      button.on("pointerdown", option.callback);
      button.on("pointerover", () => button.setStyle({ backgroundColor: "#555555" }));
      button.on("pointerout", () => button.setStyle({ backgroundColor: "#333333" }));
      
      buttons.push(button);
    });

    // Add all elements to container in proper order
    this.conversationPanel.add([background, greetingText, ...buttons]);
    this.conversationPanel.setDepth(2000);
  }

  showWellbeingResponse(npc: any) {
    const personality = NPC_PERSONALITIES[npc.name];
    const response = personality 
      ? getPersonalityWellbeingResponse(npc, personality)
      : this.getBasicWellbeingResponse(npc);
    
    this.showNPCDialogueResponse(npc, response);
  }

  showOccupationResponse(npc: any) {
    const personality = NPC_PERSONALITIES[npc.name];
    const task = this.resourceManager.getNPCTask(npc.name);
    const currentHour = this.worldData?.currentHour;
    const response = personality 
      ? getPersonalityOccupationResponse(npc, personality, task, currentHour)
      : this.getBasicOccupationResponse(npc);
    
    this.showNPCDialogueResponse(npc, response);
  }

  handleCrisisResponse(npc: any, action: string, crisis: any) {
    let response = "";
    
    switch (action) {
      case "give_food":
        response = "Thank you! Oh thank you so much! *takes the food gratefully* You've saved my life! I won't forget this kindness!";
        // TODO: Actually modify NPC's food need when we have that system
        break;
        
      case "offer_protection":
        response = "You would do that for me? *tears of relief* Thank you! I feel safer already knowing you're here to help.";
        break;
        
      case "give_money":
        response = "Bless you! This will help me get back on my feet. I promise I'll repay your kindness someday!";
        break;
        
      case "comfort":
        response = "*sniffles* Thank you for listening... Sometimes that's all we need, isn't it? Someone who cares...";
        break;
        
      case "refuse_help":
        if (crisis.severity === 'extreme') {
          response = "*looks devastated* No... no, please! You're my last hope! I... I don't know what I'll do...";
        } else {
          response = "*looks disappointed* I... I understand. Everyone has their own problems. I'll... I'll figure something out.";
        }
        break;
        
      default:
        response = "Thank you for trying to help. It means more than you know.";
    }
    
    this.showNPCDialogueResponse(npc, response);
  }

  showNPCDialogueResponse(npc: any, responseText: string) {
    if (this.conversationPanel) {
      this.conversationPanel.destroy();
    }

    // Create container for conversation UI
    this.conversationPanel = this.add.container(0, 0);

    // Smaller response panel
    const panelWidth = 600;
    const panelHeight = 250; // Reduced height
    const panelX = (1600 - panelWidth) / 2;
    const panelY = (1000 - panelHeight) / 2 - 50; // Moved up a bit

    const background = this.add.rectangle(
      panelX + panelWidth / 2,
      panelY + panelHeight / 2,
      panelWidth,
      panelHeight,
      0x000000,
      0.95 // More opaque
    );
    background.setStrokeStyle(3, 0x666666);

    // NPC name
    const nameText = this.add.text(panelX + 20, panelY + 20, `${npc.name}:`, {
      fontSize: "20px",
      color: "#fff",
      fontStyle: "bold",
    });

    // Response text
    const dialogueBox = this.add.text(panelX + 20, panelY + 60, responseText, {
      fontSize: "16px",
      color: "#fff",
      wordWrap: { width: panelWidth - 40 },
      lineSpacing: 8,
    });

    // Continue button
    const continueButton = this.add.text(panelX + panelWidth/2 - 50, panelY + panelHeight - 50, "Continue", {
      fontSize: "16px",
      color: "#4af",
      backgroundColor: "#333333",
      padding: { x: 15, y: 8 },
    });
    
    continueButton.setInteractive();
    continueButton.on("pointerdown", () => this.createSimpleConversationUI(npc));
    continueButton.on("pointerover", () => continueButton.setStyle({ backgroundColor: "#555555" }));
    continueButton.on("pointerout", () => continueButton.setStyle({ backgroundColor: "#333333" }));

    // Add all elements to container
    this.conversationPanel.add([background, nameText, dialogueBox, continueButton]);
    this.conversationPanel.setDepth(2100); // Higher depth to ensure it's on top
  }

  getBasicWellbeingResponse(npc: any): string {
    const avgNeed = (npc.needFood + npc.needSafety) / 2;
    
    if (avgNeed < 30) {
      return "I'm struggling terribly! I need help urgently.";
    } else if (avgNeed < 60) {
      return "I'm managing, but things could be better.";
    } else {
      return "I'm doing well, thank you for asking!";
    }
  }

  getBasicOccupationResponse(npc: any): string {
    const task = this.resourceManager.getNPCTask(npc.name);
    const occupation = npc.occupation || "Villager";
    
    if (task) {
      return `I'm a ${occupation}, currently working on making ${task.amount}x ${task.resource}. Should be done in ${task.endHour - this.worldData.currentHour} hours.`;
    } else {
      return `I'm a ${occupation}. I do my part to keep our community running.`;
    }
  }

  showNPCInfo(npc: any) {
    // Track which NPC we're currently displaying
    this.currentDisplayedNPC = npc;
    
    // Generate and display the info
    this.updateNPCInfoDisplay();
  }

  updateNPCInfoDisplay() {
    if (!this.currentDisplayedNPC) return;

    // Find the current NPC data in the world state (get fresh data)
    const currentNPCData = this.worldData?.npcs?.find((n: any) => n.name === this.currentDisplayedNPC.name);
    if (!currentNPCData) {
      // NPC not found in current world data, use cached data
      this.generateNPCInfoText(this.currentDisplayedNPC);
      return;
    }

    // Use current world data for up-to-date stats
    this.generateNPCInfoText(currentNPCData);
  }

  generateNPCInfoText(npc: any) {
    // Clear existing content
    if (this.npcInfoPanel) {
      this.npcInfoPanel.removeAll(true);
      
      // Background
      const bg = this.add.rectangle(0, 0, 380, 600, 0x000000, 0.8);
      bg.setOrigin(0, 0);
      this.npcInfoPanel.add(bg);

      let yPos = 10;
      
      // Title
      const title = this.add.text(10, yPos, `📋 ${npc.name}`, {
        fontSize: "18px",
        color: "#fff",
        fontStyle: "bold"
      });
      this.npcInfoPanel.add(title);
      yPos += 30;

      // Occupation
      const occupation = this.add.text(10, yPos, `Occupation: ${npc.occupation || "Villager"}`, {
        fontSize: "14px",
        color: "#ccc"
      });
      this.npcInfoPanel.add(occupation);
      yPos += 25;

      // Show behavior info if available
      const behaviorNPC = this.cycleSystem.getNPC(npc.name);
      if (behaviorNPC) {
        const location = this.locationSystem.getLocation(behaviorNPC.currentLocation);
        const locationText = this.add.text(10, yPos, `📍 Location: ${location?.name || "Unknown"}`, {
          fontSize: "14px",
          color: "#88ccff"
        });
        this.npcInfoPanel.add(locationText);
        yPos += 20;

        const activityText = this.add.text(10, yPos, `🎯 Activity: ${behaviorNPC.currentActivity}`, {
          fontSize: "14px", 
          color: "#88ccff"
        });
        this.npcInfoPanel.add(activityText);
        yPos += 20;
      }

      // Show current production task or production status
      const task = this.resourceManager.getNPCTask(npc.name);
      if (task) {
        const hoursLeft = task.endHour - this.worldData.currentHour;
        const productionText = this.add.text(10, yPos, `🏭 Making: ${task.amount}x ${task.resource} (${hoursLeft}h left)`, {
          fontSize: "14px",
          color: "#ffaa44"
        });
        this.npcInfoPanel.add(productionText);
        yPos += 20;
      } else if (behaviorNPC && behaviorNPC.workplace) {
        // Check if NPC can work based on location
        const recipe = PRODUCTION_RECIPES[npc.occupation?.toLowerCase()];
        if (recipe) {
          if (behaviorNPC.currentLocation !== behaviorNPC.workplace) {
            const productionText = this.add.text(10, yPos, `🏭 Cannot work: Not at workplace`, {
              fontSize: "14px",
              color: "#ff8888"
            });
            this.npcInfoPanel.add(productionText);
            yPos += 20;
          } else {
            const productionText = this.add.text(10, yPos, `🏭 Ready to work: Can make ${recipe.amount}x ${recipe.produces}`, {
              fontSize: "14px",
              color: "#88ff88"
            });
            this.npcInfoPanel.add(productionText);
            yPos += 20;
          }
        }
      }

      // Add personality info if available
      const personality = NPC_PERSONALITIES[npc.name];
      if (personality) {
        const traits = personality.traits;
        let personalityInfo = "🧠 Personality: ";
        const traitsList = [];
        
        if (traits.extraversion > 70) traitsList.push("Outgoing");
        else if (traits.extraversion < 30) traitsList.push("Reserved");
        
        if (traits.conscientiousness > 70) traitsList.push("Reliable");
        if (traits.agreeableness > 70) traitsList.push("Helpful");
        if (traits.neuroticism > 60) traitsList.push("Anxious");
        else if (traits.neuroticism < 40) traitsList.push("Calm");

        personalityInfo += traitsList.join(", ") || "Balanced";

        const personalityText = this.add.text(10, yPos, personalityInfo, {
          fontSize: "13px",
          color: "#cc88ff"
        });
        this.npcInfoPanel.add(personalityText);
        yPos += 20;
      }

      // Show goals if available
      if (npc.goals && npc.goals.length > 0) {
        const goalsText = this.add.text(10, yPos, `🎯 Goal: ${npc.goals[0].type} (Priority: ${npc.goals[0].priority})`, {
          fontSize: "14px",
          color: "#ffcc88"
        });
        this.npcInfoPanel.add(goalsText);
        yPos += 20;
      }

      // Check for crisis
      const crisis = detectCrisis(npc);
      if (crisis) {
        const crisisText = this.add.text(10, yPos, `⚠️ CRISIS: ${crisis.type.toUpperCase()} (${crisis.severity})`, {
          fontSize: "14px",
          color: "#ff4444",
          fontStyle: "bold"
        });
        this.npcInfoPanel.add(crisisText);
        yPos += 25;
      }

      // Testing mode toggle
      yPos += 10;
      const testingToggle = this.add.text(10, yPos, this.testingMode ? "🔧 Testing Mode: ON" : "🔧 Testing Mode: OFF", {
        fontSize: "13px",
        color: this.testingMode ? "#44ff44" : "#ff4444",
        backgroundColor: "#333",
        padding: { x: 6, y: 3 }
      });
      testingToggle.setInteractive();
      testingToggle.on('pointerdown', () => {
        this.testingMode = !this.testingMode;
        this.generateNPCInfoText(npc); // Refresh to update button text
      });
      testingToggle.on('pointerover', () => {
        testingToggle.setBackgroundColor("#555");
      });
      testingToggle.on('pointerout', () => {
        testingToggle.setBackgroundColor("#333");
      });
      this.npcInfoPanel.add(testingToggle);
      yPos += 25;

      // Stats with buttons
      yPos += 5;
      const statsTitle = this.add.text(10, yPos, "📊 Needs (Click +/- to adjust):", {
        fontSize: "14px",
        color: "#fff",
        fontStyle: "bold"
      });
      this.npcInfoPanel.add(statsTitle);
      yPos += 25;

      // Define stats to show with buttons
      const statsToShow = [
        { key: 'needFood', icon: '🍽️', label: 'Food' },
        { key: 'needSafety', icon: '🛡️', label: 'Safety' },
        { key: 'needWealth', icon: '💰', label: 'Wealth' },
      ];

      // Add behavior needs if available (reuse behaviorNPC from above)
      if (behaviorNPC) {
        statsToShow.push(
          { key: 'needSocial', icon: '👥', label: 'Social' },
          { key: 'needRest', icon: '😴', label: 'Rest' }
        );
      }

      // Create stat rows with buttons
      for (const stat of statsToShow) {
        const value = (stat.key.includes('Social') || stat.key.includes('Rest')) && behaviorNPC 
          ? behaviorNPC[stat.key] 
          : npc[stat.key];
        
        this.createStatRow(stat.key, stat.icon, stat.label, value, 10, yPos);
        yPos += 30;
      }

      // Emotions section
      yPos += 10;
      const emotionsTitle = this.add.text(10, yPos, "😊 Emotions:", {
        fontSize: "14px", 
        color: "#fff",
        fontStyle: "bold"
      });
      this.npcInfoPanel.add(emotionsTitle);
      yPos += 25;

      const emotionStats = [
        { key: 'emotionHappiness', icon: '😊', label: 'Happiness' },
        { key: 'emotionFear', icon: '😰', label: 'Fear' }
      ];

      for (const emotion of emotionStats) {
        this.createStatRow(emotion.key, emotion.icon, emotion.label, npc[emotion.key], 10, yPos);
        yPos += 30;
      }
    }
  }

  createStatRow(statKey: string, icon: string, label: string, value: number, x: number, y: number): void {
    if (!this.npcInfoPanel) return;

    // Stat label and value
    const statText = this.add.text(x, y, `${icon} ${label}: ${value}%`, {
      fontSize: "14px",
      color: "#fff"
    });
    this.npcInfoPanel.add(statText);

    // Minus button
    const minusBtn = this.add.text(x + 180, y, "  -  ", {
      fontSize: "16px",
      color: "#fff",
      backgroundColor: "#ff4444",
      padding: { x: 4, y: 2 }
    });
    minusBtn.setInteractive();
    minusBtn.on('pointerdown', () => {
      this.updateNPCStatValue(statKey, -5);
    });
    minusBtn.on('pointerover', () => {
      minusBtn.setBackgroundColor("#ff6666");
    });
    minusBtn.on('pointerout', () => {
      minusBtn.setBackgroundColor("#ff4444");
    });
    this.npcInfoPanel.add(minusBtn);

    // Plus button  
    const plusBtn = this.add.text(x + 220, y, "  +  ", {
      fontSize: "16px", 
      color: "#fff",
      backgroundColor: "#44ff44",
      padding: { x: 4, y: 2 }
    });
    plusBtn.setInteractive();
    plusBtn.on('pointerdown', () => {
      this.updateNPCStatValue(statKey, 5);
    });
    plusBtn.on('pointerover', () => {
      plusBtn.setBackgroundColor("#66ff66");
    });
    plusBtn.on('pointerout', () => {
      plusBtn.setBackgroundColor("#44ff44");
    });
    this.npcInfoPanel.add(plusBtn);
  }

  renderBuildings(): void {
    // Clear existing building graphics
    this.buildingGraphics.forEach(g => g.destroy());
    this.buildingTexts.forEach(t => t.destroy());
    this.buildingGraphics = [];
    this.buildingTexts = [];

    // Get all locations
    const locations = this.locationSystem.getAllLocations();

    for (const location of locations) {
      // Choose building appearance based on type
      let buildingColor = 0x8B4513; // Default brown
      let buildingSize = { width: 80, height: 60 };
      let emoji = "🏠";

      switch (location.type) {
        case 'home':
          buildingColor = 0x8B4513; // Brown
          buildingSize = { width: 70, height: 50 };
          emoji = "🏠";
          break;
        case 'workplace':
          buildingColor = 0x696969; // Gray
          buildingSize = { width: 90, height: 70 };
          if (location.name.includes("Forge")) emoji = "⚒️";
          else if (location.name.includes("Bakery")) emoji = "🍞";
          else if (location.name.includes("Healer")) emoji = "🌿";
          else if (location.name.includes("Farm")) emoji = "🌾";
          else if (location.name.includes("Lumber")) emoji = "🪓";
          else if (location.name.includes("Mine")) emoji = "⛏️";
          else emoji = "🏭";
          break;
        case 'tavern':
          buildingColor = 0x8B0000; // Dark red
          buildingSize = { width: 100, height: 80 };
          emoji = "🍺";
          break;
        case 'market':
          buildingColor = 0x228B22; // Green
          buildingSize = { width: 120, height: 60 };
          emoji = "🛒";
          break;
        case 'temple':
          buildingColor = 0x4169E1; // Royal blue
          buildingSize = { width: 80, height: 100 };
          emoji = "⛪";
          break;
        case 'town-entrance':
          buildingColor = 0x808080; // Gray
          buildingSize = { width: 60, height: 40 };
          emoji = "🚪";
          break;
      }

      // Create building rectangle
      const graphics = this.add.graphics();
      graphics.fillStyle(buildingColor, 0.8);
      graphics.fillRect(location.x, location.y, buildingSize.width, buildingSize.height);
      
      // Add border
      graphics.lineStyle(2, 0xffffff, 0.8);
      graphics.strokeRect(location.x, location.y, buildingSize.width, buildingSize.height);
      
      graphics.setDepth(50); // Below NPCs but above background
      this.buildingGraphics.push(graphics);

      // Add building name with emoji
      const nameText = this.add.text(
        location.x + buildingSize.width / 2,
        location.y + buildingSize.height / 2,
        `${emoji}\n${location.name}`,
        {
          fontSize: "12px",
          color: "#fff",
          backgroundColor: "#000000aa",
          padding: { x: 4, y: 2 },
          align: "center"
        }
      );
      nameText.setOrigin(0.5);
      nameText.setDepth(51);
      this.buildingTexts.push(nameText);

      // Make buildings clickable for info
      graphics.setInteractive(
        new Phaser.Geom.Rectangle(location.x, location.y, buildingSize.width, buildingSize.height),
        Phaser.Geom.Rectangle.Contains
      );
      
      graphics.on('pointerdown', () => {
        this.showBuildingInfo(location);
      });
      
      graphics.on('pointerover', () => {
        graphics.setAlpha(0.9);
      });
      
      graphics.on('pointerout', () => {
        graphics.setAlpha(1.0);
      });
    }

    console.log(`🏠 Rendered ${locations.length} buildings`);
  }

  showBuildingInfo(location: any): void {
    // Clear displayed NPC when showing building info
    this.currentDisplayedNPC = undefined;

    if (this.npcInfoPanel) {
      this.npcInfoPanel.removeAll(true);
      
      // Background
      const bg = this.add.rectangle(0, 0, 380, 300, 0x000000, 0.8);
      bg.setOrigin(0, 0);
      this.npcInfoPanel.add(bg);

      let yPos = 10;
      
      // Building title
      const title = this.add.text(10, yPos, `🏢 ${location.name}`, {
        fontSize: "18px",
        color: "#fff",
        fontStyle: "bold"
      });
      this.npcInfoPanel.add(title);
      yPos += 30;

      // Building type
      const type = this.add.text(10, yPos, `Type: ${location.type}`, {
        fontSize: "14px",
        color: "#ccc"
      });
      this.npcInfoPanel.add(type);
      yPos += 25;

      // Description
      const description = this.add.text(10, yPos, location.description, {
        fontSize: "14px",
        color: "#aaa",
        wordWrap: { width: 350 }
      });
      this.npcInfoPanel.add(description);
      yPos += 40;

      // Show residents for homes
      if (location.type === 'home' && location.residents && location.residents.length > 0) {
        const residentsText = this.add.text(10, yPos, `👥 Residents: ${location.residents.join(', ')}`, {
          fontSize: "14px",
          color: "#88ccff"
        });
        this.npcInfoPanel.add(residentsText);
        yPos += 25;

        const capacityText = this.add.text(10, yPos, `📊 Capacity: ${location.residents.length}/${location.capacity || 'unlimited'}`, {
          fontSize: "14px",
          color: "#88ccff"
        });
        this.npcInfoPanel.add(capacityText);
        yPos += 25;
      }

      // Show coordinates for debugging
      const coordsText = this.add.text(10, yPos, `📍 Position: (${location.x}, ${location.y})`, {
        fontSize: "12px",
        color: "#666"
      });
      this.npcInfoPanel.add(coordsText);
    }
  }
  
  updateStatusBar() {
    // Force update the status bar
    if (this.worldData) {
      this.renderWorld();
    }
  }

  closeConversation() {
    console.log("Closing conversation");
    
    if (this.conversationPanel) {
      this.conversationPanel.destroy();
      this.conversationPanel = undefined;
    }
    
    this.isInConversation = false;
    this.currentConversationNPC = undefined;
  }

  update() {
    // Handle player movement
    if (this.player && this.cursors && this.wasd) {
      let velocityX = 0;
      let velocityY = 0;

      // Check movement keys
      if (this.cursors.left.isDown || this.wasd.left.isDown) {
        velocityX = -this.playerSpeed;
      } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
        velocityX = this.playerSpeed;
      }

      if (this.cursors.up.isDown || this.wasd.up.isDown) {
        velocityY = -this.playerSpeed;
      } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
        velocityY = this.playerSpeed;
      }

      // Normalize diagonal movement
      if (velocityX !== 0 && velocityY !== 0) {
        velocityX *= 0.707; // 1/sqrt(2)
        velocityY *= 0.707;
      }

      // Apply movement with delta time for frame-rate independence
      const deltaTime = this.game.loop.delta / 1000; // Convert to seconds
      const newX = this.player.x + velocityX * deltaTime;
      const newY = this.player.y + velocityY * deltaTime;

      // Keep player within world bounds (with small margin)
      const margin = 50;
      if (newX >= margin && newX <= 1600 - margin) {
        this.player.x = newX;
      }
      if (newY >= margin && newY <= 1000 - margin) {
        this.player.y = newY;
      }
      
      // Check if player entered a crisis zone
      if (this.locationCrisisSystem && (this.player.x !== this.lastPlayerPosition.x || this.player.y !== this.lastPlayerPosition.y)) {
        const crisisEvent = this.locationCrisisSystem.checkPlayerInCrisisZone(this.player.x, this.player.y);
        
        if (crisisEvent) {
          // Show crisis notification
          this.showCrisisNotification(crisisEvent.message);
          
          // Apply effects to nearby NPCs
          if (crisisEvent.npcEffects && this.worldData?.npcs) {
            // Find the zone that triggered this event
            const triggeredZone = CRISIS_ZONES.find(zone => 
              this.player.x >= zone.x && 
              this.player.x <= zone.x + zone.width && 
              this.player.y >= zone.y && 
              this.player.y <= zone.y + zone.height
            );
            
            if (triggeredZone) {
              // Convert world NPCs to format expected by crisis system
              const npcSpritesArray = Array.from(this.npcSprites.entries()).map(([name, visual]) => ({
                name,
                sprite: visual.sprite,
                ...this.worldData.npcs.find((n: any) => n.name === name)
              }));
              
              const effectsList = this.locationCrisisSystem.applyCrisisEffectsToNPCs(
                triggeredZone,
                crisisEvent,
                npcSpritesArray
              );
              
              // Show floating text for each affected NPC
              for (const effectString of effectsList) {
                const [npcName, effects] = effectString.split(':');
                const npcVisual = this.npcSprites.get(npcName);
                
                if (npcVisual) {
                  this.showNPCEffectText(npcVisual.sprite, effects.split('|'));
                }
              }
              
              // Update NPC info display if we're viewing an affected NPC
              this.updateNPCInfoDisplay();
            }
          }
        }
        
        this.lastPlayerPosition = { x: this.player.x, y: this.player.y };
      }
    }
  }
  
  showCrisisNotification(message: string) {
    // Create notification text at top center
    const notification = this.add.text(800, 100, message, {
      fontSize: "20px",
      color: "#ff0000",
      backgroundColor: "#000000dd",
      padding: { x: 20, y: 10 }
    });
    notification.setOrigin(0.5);
    notification.setDepth(2000);
    notification.setScrollFactor(0); // Keep it on screen
    
    // Pulse effect
    this.tweens.add({
      targets: notification,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: 2
    });
    
    // Remove after 3 seconds
    this.time.delayedCall(3000, () => {
      notification.destroy();
    });
  }
  
  showNPCEffectText(npcSprite: Phaser.GameObjects.Sprite, effects: string[]) {
    let yOffset = -60;
    
    for (const effect of effects) {
      // Determine color based on effect type
      let color = "#ffffff";
      if (effect.includes("-")) {
        color = "#ff4444"; // Red for negative
      } else if (effect.includes("+")) {
        color = "#44ff44"; // Green for positive
      }
      
      // Create floating text
      const floatingText = this.add.text(
        npcSprite.x,
        npcSprite.y + yOffset,
        effect,
        {
          fontSize: "16px",
          color: color,
          stroke: "#000000",
          strokeThickness: 3,
          fontStyle: "bold"
        }
      );
      floatingText.setOrigin(0.5);
      floatingText.setDepth(1500);
      
      // Animate floating up and fading
      this.tweens.add({
        targets: floatingText,
        y: floatingText.y - 50,
        alpha: 0,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => {
          floatingText.destroy();
        }
      });
      
      yOffset -= 20; // Stack multiple effects
    }
  }
}

// Phaser game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1600,
  height: 1000,
  parent: "game",
  backgroundColor: "#1a1a2e",
  scene: [GameScene],
  pixelArt: true, // Critical for crisp sprites!
  antialias: false,
};

// Start Phaser
window.addEventListener("DOMContentLoaded", () => {
  console.log("🎮 Starting VibeMaster with 16x16 Sprites...");
  console.log("Mode:", isTauri ? "Tauri Desktop" : "Browser Development");
  new Phaser.Game(config);
});
