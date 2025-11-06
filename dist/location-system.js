"use strict";
// location-system.ts - World locations including shared homes
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationSystem = void 0;
/**
 * World locations with shared housing
 */
class LocationSystem {
    locations = new Map();
    constructor() {
        this.initializeLocations();
    }
    /**
     * Initialize default locations
     */
    initializeLocations() {
        // Shared Homes (multiple NPCs per house)
        this.addLocation({
            id: "cottage-1",
            name: "Riverside Cottage",
            type: "home",
            x: 300,
            y: 200,
            capacity: 3,
            residents: [], // Will be assigned
            description: "A cozy cottage near the river",
            ambience: "home-quiet",
        });
        this.addLocation({
            id: "cottage-2",
            name: "Mill House",
            type: "home",
            x: 350,
            y: 250,
            capacity: 2,
            residents: [],
            description: "A small house near the old mill",
            ambience: "home-quiet",
        });
        this.addLocation({
            id: "cottage-3",
            name: "Forest Edge Home",
            type: "home",
            x: 280,
            y: 180,
            capacity: 3,
            residents: [],
            description: "A home at the edge of the forest",
            ambience: "home-quiet",
        });
        // Workplaces
        this.addLocation({
            id: "blacksmith-shop",
            name: "Marcus's Forge",
            type: "workplace",
            x: 500,
            y: 300,
            description: "A hot forge with the sound of hammering",
            ambience: "hammer-anvil",
        });
        this.addLocation({
            id: "bakery",
            name: "The Village Bakery",
            type: "workplace",
            x: 550,
            y: 350,
            description: "Warm ovens and the smell of fresh bread",
            ambience: "oven-crackling",
        });
        this.addLocation({
            id: "healers-hut",
            name: "Healer's Sanctuary",
            type: "workplace",
            x: 450,
            y: 280,
            description: "A peaceful place filled with herbs and remedies",
            ambience: "quiet-herbs",
        });
        this.addLocation({
            id: "farm",
            name: "Village Farm",
            type: "workplace",
            x: 700,
            y: 500,
            description: "Fields of crops stretching toward the horizon",
            ambience: "nature-birds",
        });
        this.addLocation({
            id: "lumber-yard",
            name: "Lumber Yard",
            type: "workplace",
            x: 250,
            y: 400,
            description: "Stacks of wood and the smell of fresh-cut timber",
            ambience: "sawing-wood",
        });
        this.addLocation({
            id: "mine",
            name: "Stone Mine",
            type: "workplace",
            x: 800,
            y: 350,
            description: "A dark entrance into the hillside",
            ambience: "pickaxe-echo",
        });
        // Social locations
        this.addLocation({
            id: "tavern",
            name: "The Rusty Tankard",
            type: "tavern",
            x: 600,
            y: 400,
            description: "A lively tavern filled with laughter and conversation",
            ambience: "tavern-chatter",
        });
        this.addLocation({
            id: "market",
            name: "Village Market",
            type: "market",
            x: 650,
            y: 380,
            description: "A bustling market square with vendors and shoppers",
            ambience: "market-bustle",
        });
        this.addLocation({
            id: "temple",
            name: "Village Temple",
            type: "temple",
            x: 550,
            y: 250,
            description: "A peaceful temple for reflection and prayer",
            ambience: "temple-bells",
        });
        // Safety location
        this.addLocation({
            id: "town-entrance",
            name: "Town Entrance",
            type: "town-entrance",
            x: 600,
            y: 100,
            description: "The guarded entrance to the village - the safest place",
            ambience: "guards-patrol",
        });
        console.log(`📍 Initialized ${this.locations.size} locations`);
    }
    /**
     * Add a location to the world
     */
    addLocation(location) {
        this.locations.set(location.id, location);
    }
    /**
     * Get location by ID
     */
    getLocation(id) {
        return this.locations.get(id);
    }
    /**
     * Get all locations
     */
    getAllLocations() {
        return Array.from(this.locations.values());
    }
    /**
     * Get locations by type
     */
    getLocationsByType(type) {
        return Array.from(this.locations.values()).filter((loc) => loc.type === type);
    }
    /**
     * Get available homes (not at capacity)
     */
    getAvailableHomes() {
        return this.getLocationsByType("home").filter((home) => !home.capacity || (home.residents?.length || 0) < home.capacity);
    }
    /**
     * Assign NPC to a home
     */
    assignNPCToHome(npcName, homeId) {
        // If specific home requested, use it
        if (homeId) {
            const home = this.getLocation(homeId);
            if (home && home.type === "home") {
                if (!home.residents)
                    home.residents = [];
                if (!home.residents.includes(npcName)) {
                    home.residents.push(npcName);
                }
                console.log(`🏠 Assigned ${npcName} to ${home.name}`);
                return homeId;
            }
        }
        // Otherwise, find available home
        const availableHomes = this.getAvailableHomes();
        if (availableHomes.length === 0) {
            console.warn(`⚠️  No available homes! Creating emergency home for ${npcName}`);
            // Create emergency home
            const emergencyHome = {
                id: `home-${npcName}`,
                name: `${npcName}'s Home`,
                type: "home",
                x: 300 + Math.random() * 100,
                y: 200 + Math.random() * 100,
                capacity: 1,
                residents: [npcName],
            };
            this.addLocation(emergencyHome);
            return emergencyHome.id;
        }
        // Assign to first available home
        const home = availableHomes[0];
        if (!home.residents)
            home.residents = [];
        home.residents.push(npcName);
        console.log(`🏠 Assigned ${npcName} to ${home.name} (${home.residents.length}/${home.capacity || "∞"} residents)`);
        return home.id;
    }
    /**
     * Assign NPC to workplace based on occupation
     */
    assignWorkplace(npcName, occupation) {
        const occupationToWorkplace = {
            blacksmith: "blacksmith-shop",
            baker: "bakery",
            healer: "healers-hut",
            herbalist: "healers-hut",
            farmer: "farm",
            lumberjack: "lumber-yard",
            miner: "mine",
            carpenter: "blacksmith-shop", // Shares with blacksmith
            weaponsmith: "blacksmith-shop", // Shares with blacksmith
            tailor: "market", // Works at market stall
        };
        const workplaceId = occupationToWorkplace[occupation.toLowerCase()];
        if (workplaceId) {
            const workplace = this.getLocation(workplaceId);
            if (workplace) {
                console.log(`🔨 Assigned ${npcName} (${occupation}) to ${workplace.name}`);
                return workplaceId;
            }
        }
        console.warn(`⚠️  No workplace found for ${npcName} (${occupation})`);
        return undefined;
    }
    /**
     * Get distance between two locations
     */
    getDistance(loc1Id, loc2Id) {
        const l1 = this.getLocation(loc1Id);
        const l2 = this.getLocation(loc2Id);
        if (!l1 || !l2)
            return Infinity;
        const dx = l1.x - l2.x;
        const dy = l1.y - l2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    /**
     * Log all locations and their residents
     */
    logLocations() {
        console.log("\n📍 === LOCATION OVERVIEW ===");
        const byType = {
            home: [],
            workplace: [],
            tavern: [],
            market: [],
            temple: [],
            "town-entrance": [],
        };
        for (const loc of this.locations.values()) {
            byType[loc.type].push(loc);
        }
        // Homes
        console.log("\n🏠 HOMES:");
        for (const home of byType.home) {
            const residents = home.residents?.join(", ") || "empty";
            const occupancy = `${home.residents?.length || 0}/${home.capacity || "∞"}`;
            console.log(`   ${home.name} (${occupancy}): ${residents}`);
        }
        // Workplaces
        console.log("\n🔨 WORKPLACES:");
        for (const work of byType.workplace) {
            console.log(`   ${work.name} at (${work.x}, ${work.y})`);
        }
        // Social
        console.log("\n👥 SOCIAL LOCATIONS:");
        for (const social of [
            ...byType.tavern,
            ...byType.market,
            ...byType.temple,
        ]) {
            console.log(`   ${social.name} at (${social.x}, ${social.y})`);
        }
        // Safety
        console.log("\n🛡️  SAFETY:");
        for (const safe of byType["town-entrance"]) {
            console.log(`   ${safe.name} at (${safe.x}, ${safe.y})`);
        }
    }
}
exports.LocationSystem = LocationSystem;
//# sourceMappingURL=location-system.js.map