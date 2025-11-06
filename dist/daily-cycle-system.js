"use strict";
// daily-cycle-system.ts - Manages 4 daily checkpoints and NPC updates
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyCycleSystem = void 0;
const need_based_behavior_1 = require("./need-based-behavior");
/**
 * Daily cycle with 4 checkpoints: Dawn, Midday, Evening, Night
 */
class DailyCycleSystem {
    behaviorSystem;
    locationSystem;
    npcs = new Map();
    lastCheckpointHour = -1;
    // 4 checkpoints per day
    CHECKPOINTS = [6, 12, 18, 22];
    CHECKPOINT_NAMES = {
        6: "Dawn",
        12: "Midday",
        18: "Evening",
        22: "Night",
    };
    constructor(locationSystem) {
        this.behaviorSystem = new need_based_behavior_1.NeedBasedBehavior();
        this.locationSystem = locationSystem;
    }
    /**
     * Register an NPC in the system
     */
    registerNPC(npc) {
        // Assign home if not set
        if (!npc.home) {
            npc.home = this.locationSystem.assignNPCToHome(npc.name);
        }
        // Assign workplace if not set
        if (!npc.workplace && npc.occupation) {
            const workplace = this.locationSystem.assignWorkplace(npc.name, npc.occupation);
            if (workplace) {
                npc.workplace = workplace;
            }
        }
        // Set initial location to home
        if (!npc.currentLocation) {
            npc.currentLocation = npc.home;
            npc.currentActivity = "resting";
        }
        this.npcs.set(npc.name, npc);
        console.log(`✅ Registered ${npc.name} (home: ${npc.home}, workplace: ${npc.workplace || "none"})`);
    }
    /**
     * Get NPC by name
     */
    getNPC(name) {
        return this.npcs.get(name);
    }
    /**
     * Get all NPCs
     */
    getAllNPCs() {
        return Array.from(this.npcs.values());
    }
    /**
     * Get NPCs at a specific location
     */
    getNPCsAtLocation(locationId) {
        return Array.from(this.npcs.values()).filter((npc) => npc.currentLocation === locationId);
    }
    /**
     * Main update - called every hour
     */
    onHourChange(newHour) {
        const isCheckpoint = this.CHECKPOINTS.includes(newHour);
        if (isCheckpoint && newHour !== this.lastCheckpointHour) {
            this.runCheckpoint(newHour);
            this.lastCheckpointHour = newHour;
        }
    }
    /**
     * Run a checkpoint - evaluate all NPCs
     */
    runCheckpoint(hour) {
        const checkpointName = this.CHECKPOINT_NAMES[hour];
        console.log(`\n${"=".repeat(70)}`);
        console.log(`🌅 ${checkpointName.toUpperCase()} CHECKPOINT (Hour ${hour})`);
        console.log("=".repeat(70));
        // 1. Decay all needs
        console.log("\n⏬ === NEED DECAY ===");
        for (const npc of this.npcs.values()) {
            this.behaviorSystem.decayNeeds(npc, 1);
        }
        // 2. Check for fleeing NPCs (critical security)
        console.log("\n🏃 === SECURITY CHECK ===");
        const fleeingNPCs = Array.from(this.npcs.values()).filter((npc) => npc.needSafety < 20);
        if (fleeingNPCs.length > 0) {
            console.log(`⚠️  ${fleeingNPCs.length} NPCs have critical security and are fleeing!`);
            for (const npc of fleeingNPCs) {
                console.log(`   🏃 ${npc.name}: Safety(${npc.needSafety}%) - FLEEING!`);
            }
        }
        else {
            console.log("✅ All NPCs feel safe");
        }
        // 3. Decide actions for all NPCs
        console.log("\n🧠 === NPC DECISIONS ===");
        const decisions = new Map();
        for (const npc of this.npcs.values()) {
            const decision = this.behaviorSystem.decideAction(npc, hour);
            decisions.set(npc.name, decision);
        }
        // 4. Move NPCs to new locations
        console.log("\n🚶 === NPC MOVEMENT ===");
        for (const [npcName, decision] of decisions.entries()) {
            const npc = this.npcs.get(npcName);
            const oldLocation = npc.currentLocation;
            const newLocation = decision.location;
            if (oldLocation !== newLocation) {
                npc.currentLocation = newLocation;
                npc.currentActivity = decision.activity;
                const fromLoc = this.locationSystem.getLocation(oldLocation);
                const toLoc = this.locationSystem.getLocation(newLocation);
                console.log(`   🚶 ${npcName}: ${fromLoc?.name || oldLocation} → ${toLoc?.name || newLocation}`);
                console.log(`      Activity: ${decision.activity} (${decision.reason})`);
            }
            else {
                console.log(`   ⏸️  ${npcName}: Staying at ${this.locationSystem.getLocation(newLocation)?.name || newLocation}`);
                npc.currentActivity = decision.activity;
            }
        }
        // 5. Show location summary
        console.log("\n📍 === LOCATION SUMMARY ===");
        this.logLocationOccupancy();
        console.log(`\n${"=".repeat(70)}\n`);
    }
    /**
     * Log which NPCs are at each location
     */
    logLocationOccupancy() {
        const occupancy = new Map();
        // Group NPCs by location
        for (const npc of this.npcs.values()) {
            const loc = npc.currentLocation;
            if (!occupancy.has(loc)) {
                occupancy.set(loc, []);
            }
            occupancy.get(loc).push(`${npc.name} (${npc.currentActivity})`);
        }
        // Display
        for (const [locId, npcNames] of occupancy.entries()) {
            const location = this.locationSystem.getLocation(locId);
            const locName = location?.name || locId;
            const emoji = this.getLocationEmoji(location?.type);
            console.log(`   ${emoji} ${locName}:`);
            for (const name of npcNames) {
                console.log(`      - ${name}`);
            }
        }
    }
    /**
     * Get emoji for location type
     */
    getLocationEmoji(type) {
        const emojis = {
            home: "🏠",
            workplace: "🔨",
            tavern: "🍺",
            market: "🏪",
            temple: "⛪",
            "town-entrance": "🛡️",
        };
        return emojis[type || ""] || "📍";
    }
    /**
     * Update NPC needs based on their activity (called continuously)
     */
    updateNPCNeeds() {
        for (const npc of this.npcs.values()) {
            this.behaviorSystem.recoverNeeds(npc, npc.currentActivity);
        }
    }
    /**
     * Manually trigger security threat (for testing)
     */
    triggerSecurityThreat(severity) {
        const securityDrop = {
            minor: 20,
            major: 40,
            critical: 70,
        };
        const drop = securityDrop[severity];
        console.log(`\n⚠️  === SECURITY THREAT: ${severity.toUpperCase()} ===`);
        console.log(`All NPCs lose ${drop} security!`);
        for (const npc of this.npcs.values()) {
            npc.needSafety = Math.max(0, npc.needSafety - drop);
            console.log(`   ${npc.name}: Security now ${npc.needSafety}%`);
        }
    }
    /**
     * Restore security after threat resolved
     */
    restoreSecurity(amount = 50) {
        console.log(`\n✅ === THREAT RESOLVED ===`);
        console.log(`All NPCs recover ${amount} security!`);
        for (const npc of this.npcs.values()) {
            npc.needSafety = Math.min(100, npc.needSafety + amount);
            console.log(`   ${npc.name}: Security now ${npc.needSafety}%`);
        }
    }
    /**
     * Get next checkpoint info
     */
    getNextCheckpoint(currentHour) {
        for (const checkpoint of this.CHECKPOINTS) {
            if (checkpoint > currentHour) {
                return {
                    hour: checkpoint,
                    name: this.CHECKPOINT_NAMES[checkpoint],
                    hoursUntil: checkpoint - currentHour,
                };
            }
        }
        // Next checkpoint is tomorrow's first checkpoint
        return {
            hour: this.CHECKPOINTS[0],
            name: this.CHECKPOINT_NAMES[this.CHECKPOINTS[0]],
            hoursUntil: 24 - currentHour + this.CHECKPOINTS[0],
        };
    }
    /**
     * Get summary for UI display
     */
    getSummary(currentHour) {
        const nextCheckpoint = this.getNextCheckpoint(currentHour);
        const totalNPCs = this.npcs.size;
        const fleeing = Array.from(this.npcs.values()).filter((n) => n.needSafety < 20).length;
        const working = Array.from(this.npcs.values()).filter((n) => n.currentActivity === "working").length;
        const resting = Array.from(this.npcs.values()).filter((n) => n.currentActivity === "resting").length;
        let summary = `Next checkpoint: ${nextCheckpoint.name} in ${nextCheckpoint.hoursUntil}h\n`;
        summary += `NPCs: ${totalNPCs} total`;
        if (fleeing > 0)
            summary += `, ${fleeing} fleeing!`;
        if (working > 0)
            summary += `, ${working} working`;
        if (resting > 0)
            summary += `, ${resting} resting`;
        return summary;
    }
}
exports.DailyCycleSystem = DailyCycleSystem;
//# sourceMappingURL=daily-cycle-system.js.map