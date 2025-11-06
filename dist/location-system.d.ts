import { Location, LocationType } from "./need-based-behavior";
/**
 * World locations with shared housing
 */
export declare class LocationSystem {
    private locations;
    constructor();
    /**
     * Initialize default locations
     */
    private initializeLocations;
    /**
     * Add a location to the world
     */
    addLocation(location: Location): void;
    /**
     * Get location by ID
     */
    getLocation(id: string): Location | undefined;
    /**
     * Get all locations
     */
    getAllLocations(): Location[];
    /**
     * Get locations by type
     */
    getLocationsByType(type: LocationType): Location[];
    /**
     * Get available homes (not at capacity)
     */
    getAvailableHomes(): Location[];
    /**
     * Assign NPC to a home
     */
    assignNPCToHome(npcName: string, homeId?: string): string;
    /**
     * Assign NPC to workplace based on occupation
     */
    assignWorkplace(npcName: string, occupation: string): string | undefined;
    /**
     * Get distance between two locations
     */
    getDistance(loc1Id: string, loc2Id: string): number;
    /**
     * Log all locations and their residents
     */
    logLocations(): void;
}
//# sourceMappingURL=location-system.d.ts.map