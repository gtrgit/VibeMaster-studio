import Phaser from "phaser";
import { ResourceType, ResourceStorage } from "./resource-system";
import { ResourceManager } from "./resource-system-with-logging";
/**
 * Resource panel - shows all resources in the world
 */
export declare class ResourcePanel {
    private scene;
    private container;
    private resourceTexts;
    private x;
    private y;
    constructor(scene: Phaser.Scene, x: number, y: number);
    update(resourceManager: ResourceManager): void;
    setVisible(visible: boolean): void;
    destroy(): void;
}
/**
 * Production indicator - shows what NPCs are producing
 */
export declare class ProductionIndicator {
    private scene;
    private indicators;
    constructor(scene: Phaser.Scene);
    showProduction(npcName: string, x: number, y: number, resource: ResourceType, amount: number): void;
    hideProduction(npcName: string): void;
    destroy(): void;
}
/**
 * Storage building - clickable storage locations
 */
export declare class StorageBuilding {
    private scene;
    private storage;
    private sprite;
    private nameText;
    private onClick?;
    constructor(scene: Phaser.Scene, storage: ResourceStorage, x: number, y: number, onClick?: (storage: ResourceStorage) => void);
    private capacityBar?;
    private showCapacityBar;
    private hideCapacityBar;
    destroy(): void;
}
/**
 * Resource flow indicator - shows resources moving between locations
 */
export declare class ResourceFlowEffect {
    static showTransfer(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number, resource: ResourceType, amount: number): void;
}
//# sourceMappingURL=resource-ui.d.ts.map