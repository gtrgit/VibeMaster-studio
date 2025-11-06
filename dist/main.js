"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const phaser_1 = __importDefault(require("phaser"));
const sprite_config_1 = require("./sprite-config");
const resource_system_with_logging_1 = require("./resource-system-with-logging");
const resource_ui_1 = require("./resource-ui");
const location_system_1 = require("./location-system");
const daily_cycle_system_1 = require("./daily-cycle-system");
// Simple runtime check for Tauri without type issues
const isTauri = typeof window !== "undefined" && window.__TAURI__ !== undefined;
// Dev server URL for browser mode
const DEV_SERVER_URL = "http://localhost:3001";
// Helper function to safely call Tauri commands
async function callTauriCommand(command) {
    if (!isTauri) {
        throw new Error("Tauri commands only available in desktop mode");
    }
    try {
        const tauri = window.__TAURI__;
        if (tauri?.tauri?.invoke) {
            return await tauri.tauri.invoke(command);
        }
        throw new Error("Tauri invoke not available");
    }
    catch (e) {
        throw new Error(`Failed to call Tauri command: ${e}`);
    }
}
// Helper function to fetch from dev server (browser mode)
async function fetchFromDevServer(endpoint) {
    const response = await fetch(`${DEV_SERVER_URL}${endpoint}`);
    if (!response.ok) {
        throw new Error(`Dev server error: ${response.statusText}`);
    }
    return response.json();
}
// Get sprite tint based on NPC state
function getNPCTint(npc) {
    const avgNeed = (npc.needFood + npc.needSafety) / 2;
    if (avgNeed < 30)
        return 0xff6666; // Critical - red
    if (avgNeed < 60)
        return 0xffff88; // Warning - yellow
    return 0xffffff; // Healthy - normal
}
// Get emoji for goal type
function getGoalEmoji(goalType) {
    const goalEmojis = {
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
class GameScene extends phaser_1.default.Scene {
    statusText;
    worldData = null;
    npcSprites = new Map();
    devServerConnected = false;
    // Conversation system
    conversationPanel;
    isInConversation = false;
    currentConversationNPC;
    // Resource system
    resourceManager;
    resourcePanel;
    productionIndicator;
    storageBuildings = [];
    lastHour = -1;
    // Daily cycle system
    locationSystem;
    cycleSystem;
    // Test: Add ALL player properties
    player;
    cursors;
    wasd;
    playerSpeed = 150;
    constructor() {
        super("GameScene");
    }
    preload() {
        console.log("🎨 Loading sprites with configuration:");
        console.log(`  File: ${sprite_config_1.SPRITE_CONFIG.fileName}`);
        console.log(`  Sprite size: ${sprite_config_1.SPRITE_CONFIG.spriteWidth}x${sprite_config_1.SPRITE_CONFIG.spriteHeight}`);
        console.log(`  Sheet layout: ${sprite_config_1.SPRITE_CONFIG.columns} columns × ${sprite_config_1.SPRITE_CONFIG.rows} rows`);
        console.log(`  Total sprites: ${sprite_config_1.SPRITE_CONFIG.columns * sprite_config_1.SPRITE_CONFIG.rows}`);
        console.log(`  Display scale: ${sprite_config_1.SPRITE_CONFIG.displayScale}x`);
        // Load sprite sheet with configured dimensions
        this.load.spritesheet("characters", `assets/${sprite_config_1.SPRITE_CONFIG.fileName}`, {
            frameWidth: sprite_config_1.SPRITE_CONFIG.spriteWidth,
            frameHeight: sprite_config_1.SPRITE_CONFIG.spriteHeight,
        });
        // Print full sprite layout to console (useful for debugging)
        (0, sprite_config_1.printSpriteLayout)();
    }
    initResourceSystem() {
        console.log("🏭 Initializing resource system...");
        // Create resource manager
        this.resourceManager = new resource_system_with_logging_1.ResourceManager();
        // Create storage locations
        this.resourceManager.createStorage("warehouse", "Warehouse", "🏚️", 100, 1200, 300);
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
        this.resourcePanel = new resource_ui_1.ResourcePanel(this, 950, 50);
        this.productionIndicator = new resource_ui_1.ProductionIndicator(this);
        // Create storage building visuals
        for (const storage of this.resourceManager.getAllStorages()) {
            const building = new resource_ui_1.StorageBuilding(this, storage, storage.x, storage.y, (clickedStorage) => this.onStorageClick(clickedStorage));
            this.storageBuildings.push(building);
        }
        // Log initial state
        this.resourceManager.logStorageState();
        console.log("✅ Resource system initialized!\n");
    }
    initDailyCycleSystem() {
        console.log("🌅 Initializing daily cycle system...");
        // Create location and cycle systems
        this.locationSystem = new location_system_1.LocationSystem();
        this.cycleSystem = new daily_cycle_system_1.DailyCycleSystem(this.locationSystem);
        // Register mock NPCs with behavior system
        const mockNPCs = this.getMockData().npcs;
        for (const npc of mockNPCs) {
            const behaviorNPC = {
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
    onStorageClick(storage) {
        console.log("Clicked storage:", storage.name);
        let info = `🏢 ${storage.name}\n\n`;
        info += `Capacity: ${storage.getTotalStored()}/${storage.capacity}\n`;
        info += `Fill: ${storage.getFillPercent().toFixed(1)}%\n\n`;
        if (storage.inventory.size > 0) {
            info += `Inventory:\n`;
            for (const [resource, amount] of storage.inventory.entries()) {
                info += `  ${amount}x ${resource}\n`;
            }
        }
        else {
            info += `(Empty)`;
        }
        this.statusText?.setText(info);
    }
    updateResourceSystem(currentHour) {
        // Only update on hour change
        if (currentHour === this.lastHour)
            return;
        console.log(`\n${"=".repeat(60)}`);
        console.log(`🕐 HOUR ${currentHour} UPDATE`);
        console.log("=".repeat(60));
        // Update daily cycle system (handles checkpoints at 6, 12, 18, 22)
        this.cycleSystem.onHourChange(currentHour);
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
                this.productionIndicator.showProduction(task.npcName, npcVisual.sprite.x, npcVisual.sprite.y, task.resource, task.amount);
            }
        }
        // Auto-assign production tasks to idle NPCs
        if (this.worldData?.npcs) {
            console.log(`\n🔄 === ASSIGNING NEW TASKS ===`);
            let assignedCount = 0;
            for (const npc of this.worldData.npcs) {
                const existingTask = this.resourceManager.getNPCTask(npc.name);
                if (!existingTask &&
                    resource_system_with_logging_1.PRODUCTION_RECIPES[npc.occupation?.toLowerCase()]) {
                    const task = this.resourceManager.startProduction(npc.name, npc.occupation, currentHour, "warehouse");
                    if (task) {
                        assignedCount++;
                    }
                }
            }
            if (assignedCount > 0) {
                console.log(`\n✅ Assigned ${assignedCount} new task(s)`);
            }
            else {
                console.log(`\n⏸️  No new tasks assigned (NPCs working or missing materials)`);
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
        console.log("🔍 Window.__TAURI__:", typeof window.__TAURI__);
        // Initialize resource system FIRST
        console.log("🏭 About to init resource system...");
        this.initResourceSystem();
        console.log("✅ Resource system initialized");
        // Initialize daily cycle system SECOND
        console.log("🌅 About to init daily cycle system...");
        this.initDailyCycleSystem();
        console.log("✅ Daily cycle system initialized");
        // Create background
        console.log("🎨 About to create background...");
        this.createBackground();
        console.log("✅ Background created");
        // Create player
        console.log("🔵 About to call createPlayer...");
        this.createPlayer();
        console.log("✅ createPlayer call completed");
        // Title
        console.log("📝 About to create title...");
        this.add.text(20, 20, "🎮 VibeMaster - Living World", {
            fontSize: "32px",
            color: "#fff",
            stroke: "#000",
            strokeThickness: 4,
        });
        // Mode indicator
        const mode = isTauri ? "🖥️ Desktop Mode" : "🌐 Browser Mode (Dev)";
        this.add.text(20, 60, mode, {
            fontSize: "14px",
            color: "#888",
        });
        // Check dev server connection in browser mode
        if (!isTauri) {
            try {
                await fetchFromDevServer("/health");
                this.devServerConnected = true;
                this.add.text(20, 80, "✅ Connected to dev server", {
                    fontSize: "12px",
                    color: "#4f4",
                });
            }
            catch (e) {
                this.devServerConnected = false;
                this.add.text(20, 80, "⚠️ Dev server not running (using mock data)", {
                    fontSize: "12px",
                    color: "#f90",
                });
                console.log("ℹ️ Dev server not available. Using mock data. Run 'npm run dev:server' for live data.");
            }
        }
        // Status display
        this.statusText = this.add.text(20, isTauri ? 100 : 120, "Loading...", {
            fontSize: "16px",
            color: "#fff",
            backgroundColor: "#00000088",
            padding: { x: 10, y: 10 },
        });
        // Controls
        this.createControls();
        // Legend
        this.add.text(20, 950, "💡 WASD/Arrows: Move Player | Click NPC for details | Click storage to inspect | Middle-click drag to pan", {
            fontSize: "12px",
            color: "#888",
        });
        // Camera controls
        this.cameras.main.setBounds(0, 0, 1600, 1000);
        // Pan with middle mouse button
        this.input.on("pointermove", (pointer) => {
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
                this.add.rectangle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize, tileSize, color);
            }
        }
    }
    createPlayer() {
        // Create player sprite at center of world (using a different frame than NPCs)
        this.player = this.add.sprite(800, 500, "characters", 0)
            .setScale(sprite_config_1.SPRITE_CONFIG.displayScale)
            .setDepth(1000) // High depth so player is always on top
            .setTint(0x4444ff); // Blue tint to distinguish from NPCs
        // Set up keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        const wasdKeys = this.input.keyboard.addKeys("W,S,A,D");
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
        const yPos = isTauri ? 180 : 200;
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
                    this.statusText?.setText("✅ Simulation started!");
                }
                else {
                    this.statusText?.setText("ℹ️ Run: npm run dev");
                }
            }
            catch (e) {
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
                    this.statusText?.setText("⏸️ Stopped");
                }
                else {
                    this.statusText?.setText("ℹ️ Ctrl+C in terminal");
                }
            }
            catch (e) {
                console.error("Stop error:", e);
            }
        });
    }
    async updateWorld() {
        try {
            if (isTauri) {
                const worldDataStr = await callTauriCommand("get_world_state");
                this.worldData = JSON.parse(worldDataStr);
            }
            else {
                if (this.devServerConnected) {
                    try {
                        this.worldData = await fetchFromDevServer("/api/world-state");
                    }
                    catch (e) {
                        console.error("Dev server fetch failed:", e);
                        this.worldData = this.getMockData();
                    }
                }
                else {
                    this.worldData = this.getMockData();
                }
            }
            if (this.worldData) {
                this.updateResourceSystem(this.worldData.currentHour);
                this.renderWorld();
            }
        }
        catch (e) {
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
                    needFood: 80,
                    needSafety: 90,
                    needWealth: 60,
                    emotionHappiness: 62,
                    emotionFear: 0,
                    emotionSadness: 100,
                    goals: [{ type: "survival", priority: 80 }],
                },
                {
                    name: "Sarah",
                    occupation: "Merchant",
                    needFood: 44,
                    needSafety: 80,
                    needWealth: 40,
                    emotionHappiness: 47,
                    emotionFear: 0,
                    emotionSadness: 100,
                    goals: [{ type: "wealth", priority: 90 }],
                },
                {
                    name: "Emma",
                    occupation: "Healer",
                    needFood: 73,
                    needSafety: 85,
                    needWealth: 55,
                    emotionHappiness: 49,
                    emotionFear: 0,
                    emotionSadness: 100,
                    goals: [],
                },
            ],
        };
    }
    renderWorld() {
        const { currentDay, currentHour, npcs } = this.worldData;
        let statusText = `📅 Day ${currentDay}, Hour ${currentHour}:00\n\n`;
        statusText += `👥 ${npcs?.length || 0} NPCs active\n`;
        statusText += `📦 ${this.resourceManager.getSummary().length} resource types\n`;
        statusText += `🏭 ${this.resourceManager.getActiveTasks().length} NPCs working\n\n`;
        statusText += "Click NPC/storage for details";
        this.statusText?.setText(statusText);
        if (npcs && npcs.length > 0) {
            this.renderNPCs(npcs);
        }
    }
    renderNPCs(npcs) {
        if (!npcs || npcs.length === 0)
            return;
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
                const location = this.locationSystem.getLocation(behaviorNPC.currentLocation);
                if (location) {
                    x = location.x;
                    y = location.y;
                    // Offset multiple NPCs at same location
                    const npcsAtLocation = this.cycleSystem.getNPCsAtLocation(behaviorNPC.currentLocation);
                    const npcIndex = npcsAtLocation.findIndex((n) => n.name === npc.name);
                    if (npcIndex > 0) {
                        // Spread NPCs slightly if multiple at same location
                        const offsetAngle = (npcIndex / npcsAtLocation.length) * Math.PI * 2;
                        x += Math.cos(offsetAngle) * 30;
                        y += Math.sin(offsetAngle) * 30;
                    }
                }
            }
            let npcVisual = this.npcSprites.get(npc.name);
            if (!npcVisual) {
                // Get frame number from sprite config
                const frame = (0, sprite_config_1.getNPCSpriteFrame)(npc.occupation);
                // Log for debugging
                console.log(`Creating sprite for ${npc.name} (${npc.occupation}) → Frame ${frame}`);
                // Create sprite with configured scale
                const sprite = this.add.sprite(x, y, "characters", frame);
                sprite.setScale(sprite_config_1.SPRITE_CONFIG.displayScale);
                // Make interactive
                sprite.setInteractive();
                sprite.on("pointerdown", () => this.onNPCClick(npc));
                sprite.on("pointerover", () => {
                    sprite.setScale(sprite_config_1.SPRITE_CONFIG.displayScale * 1.2);
                });
                sprite.on("pointerout", () => {
                    sprite.setScale(sprite_config_1.SPRITE_CONFIG.displayScale);
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
            }
            else {
                // Update existing sprite
                npcVisual.sprite.setPosition(x, y);
                npcVisual.nameText.setPosition(x, y - 35);
                npcVisual.goalText?.setPosition(x, y - 50);
                npcVisual.emotionIcon?.setPosition(x + 25, y - 15);
                npcVisual.barBg.setPosition(x, y + 30);
                npcVisual.barFill.setPosition(x, y + 30);
                // Update frame if occupation changed
                npcVisual.sprite.setFrame((0, sprite_config_1.getNPCSpriteFrame)(npc.occupation));
            }
            // Apply tint
            npcVisual.sprite.setTint(getNPCTint(npc));
            // Update goal
            if (npc.goals && npc.goals.length > 0) {
                npcVisual.goalText?.setText(getGoalEmoji(npc.goals[0].type));
            }
            else {
                npcVisual.goalText?.setText("");
            }
            // Show activity emoji if in behavior system
            if (behaviorNPC) {
                const activityEmojis = {
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
            // Update emotion
            let emotionEmoji = "";
            if (npc.emotionSadness > 80)
                emotionEmoji = "😢";
            else if (npc.emotionFear > 80)
                emotionEmoji = "😰";
            else if (npc.emotionHappiness > 80)
                emotionEmoji = "😄";
            npcVisual.emotionIcon?.setText(emotionEmoji);
            // Update health bar
            const avgNeed = (npc.needFood + npc.needSafety) / 2;
            const barWidth = 60;
            const fillWidth = (avgNeed / 100) * barWidth;
            npcVisual.barFill.setDisplaySize(fillWidth, 4);
            npcVisual.barFill.x = x - (barWidth - fillWidth) / 2;
            let barColor;
            if (avgNeed > 70)
                barColor = 0x00ff00;
            else if (avgNeed > 40)
                barColor = 0xffaa00;
            else
                barColor = 0xff0000;
            npcVisual.barFill.setFillStyle(barColor);
            // Pulse if critical
            if (avgNeed < 30) {
                this.tweens.add({
                    targets: npcVisual.sprite,
                    scale: sprite_config_1.SPRITE_CONFIG.displayScale * 1.1,
                    duration: 400,
                    yoyo: true,
                    repeat: 0,
                });
            }
        }
    }
    onNPCClick(npc) {
        console.log("Clicked NPC:", npc);
        // If already in conversation, close it and return
        if (this.isInConversation) {
            this.closeConversation();
            return;
        }
        // Start conversation instead of showing stats
        this.startConversation(npc);
    }
    startConversation(npc) {
        console.log("Starting conversation with:", npc.name);
        this.isInConversation = true;
        this.currentConversationNPC = npc;
        // Create simple conversation UI
        this.createSimpleConversationUI(npc);
    }
    createSimpleConversationUI(npc) {
        // Close existing conversation if any
        if (this.conversationPanel) {
            this.conversationPanel.destroy();
        }
        // Create container for conversation UI
        this.conversationPanel = this.add.container(0, 0);
        // Simple background panel
        const panelWidth = 600;
        const panelHeight = 300;
        const panelX = (1600 - panelWidth) / 2;
        const panelY = (1000 - panelHeight) / 2;
        const background = this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2, panelWidth, panelHeight, 0x000000, 0.9);
        background.setStrokeStyle(3, 0x666666);
        // NPC greeting
        const greetingText = this.add.text(panelX + 20, panelY + 20, `${npc.name}: Hello there!`, {
            fontSize: "20px",
            color: "#fff",
            fontStyle: "bold",
        });
        // Show NPC info button
        const infoButton = this.add.text(panelX + 20, panelY + 100, "Show NPC Info", {
            fontSize: "16px",
            color: "#4af",
            backgroundColor: "#333333",
            padding: { x: 10, y: 5 },
        });
        infoButton.setInteractive();
        infoButton.on("pointerdown", () => {
            this.closeConversation();
            this.showNPCInfo(npc);
        });
        // Close button
        const closeButton = this.add.text(panelX + 20, panelY + 150, "Goodbye", {
            fontSize: "16px",
            color: "#f44",
            backgroundColor: "#333333",
            padding: { x: 10, y: 5 },
        });
        closeButton.setInteractive();
        closeButton.on("pointerdown", () => this.closeConversation());
        // Add all elements to container
        this.conversationPanel.add([background, greetingText, infoButton, closeButton]);
        this.conversationPanel.setDepth(2000);
    }
    showNPCInfo(npc) {
        // Show the original NPC info in status text
        const avgNeed = (npc.needFood + npc.needSafety) / 2;
        let info = `📋 ${npc.name}\n\n`;
        info += `Occupation: ${npc.occupation || "Villager"}\n`;
        info += `Health: ${Math.round(avgNeed)}%\n`;
        // Show behavior info if available
        const behaviorNPC = this.cycleSystem.getNPC(npc.name);
        if (behaviorNPC) {
            const location = this.locationSystem.getLocation(behaviorNPC.currentLocation);
            info += `📍 Location: ${location?.name || "Unknown"}\n`;
            info += `🎯 Activity: ${behaviorNPC.currentActivity}\n`;
        }
        info += `\nNeeds:\n`;
        info += `  🍽️ Food: ${npc.needFood}%\n`;
        info += `  🛡️ Safety: ${npc.needSafety}%\n`;
        info += `  💰 Wealth: ${npc.needWealth}%\n`;
        if (behaviorNPC) {
            info += `  👥 Social: ${behaviorNPC.needSocial}%\n`;
            info += `  😴 Rest: ${behaviorNPC.needRest}%\n`;
        }
        info += `\nEmotions:\n`;
        info += `  😊 Happy: ${npc.emotionHappiness}%\n`;
        info += `  😢 Sad: ${npc.emotionSadness}%\n`;
        info += `  😰 Fear: ${npc.emotionFear}%\n`;
        if (npc.goals && npc.goals.length > 0) {
            info += `\n🎯 Goals:\n`;
            npc.goals.slice(0, 3).forEach((goal) => {
                info += `  ${getGoalEmoji(goal.type)} ${goal.type} (${goal.priority})\n`;
            });
        }
        // Show current production task
        const task = this.resourceManager.getNPCTask(npc.name);
        if (task) {
            const hoursLeft = task.endHour - this.worldData.currentHour;
            info += `\n🏭 Production:\n`;
            info += `  Making: ${task.amount}x ${task.resource}\n`;
            info += `  Time left: ${hoursLeft}h\n`;
        }
        else {
            const recipe = resource_system_with_logging_1.PRODUCTION_RECIPES[npc.occupation?.toLowerCase()];
            if (recipe) {
                info += `\n💭 Can make:\n`;
                info += `  ${recipe.amount}x ${recipe.produces}\n`;
                if (recipe.requires) {
                    info += `  Needs: `;
                    info += recipe.requires
                        .map((r) => `${r.amount}x ${r.resource}`)
                        .join(", ");
                    info += "\n";
                }
            }
        }
        this.statusText?.setText(info);
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
            }
            else if (this.cursors.right.isDown || this.wasd.right.isDown) {
                velocityX = this.playerSpeed;
            }
            if (this.cursors.up.isDown || this.wasd.up.isDown) {
                velocityY = -this.playerSpeed;
            }
            else if (this.cursors.down.isDown || this.wasd.down.isDown) {
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
        }
    }
}
// Phaser game configuration
const config = {
    type: phaser_1.default.AUTO,
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
    new phaser_1.default.Game(config);
});
//# sourceMappingURL=main.js.map