// resource-ui.ts - Resource display components for Phaser

import Phaser from "phaser";
import {
  ResourceType,
  RESOURCE_INFO,
  ResourceStorage,
  // ResourceManager,
} from "./resource-system";

import { ResourceManager } from "./resource-system-with-logging";
/**
 * Resource panel - shows all resources in the world
 */
export class ResourcePanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private resourceTexts: Map<ResourceType, Phaser.GameObjects.Text> = new Map();
  private x: number;
  private y: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.container = scene.add.container(x, y);

    // Background
    const bg = scene.add.rectangle(0, 0, 200, 400, 0x000000, 0.8);
    bg.setOrigin(0, 0);
    this.container.add(bg);

    // Title
    const title = scene.add.text(10, 10, "📦 Resources", {
      fontSize: "18px",
      color: "#fff",
      fontStyle: "bold",
    });
    this.container.add(title);

    // Separator
    const line = scene.add.rectangle(10, 40, 180, 2, 0x444444);
    line.setOrigin(0, 0);
    this.container.add(line);
  }

  update(resourceManager: ResourceManager): void {
    // Clear old texts
    this.resourceTexts.forEach((text) => text.destroy());
    this.resourceTexts.clear();

    const summary = resourceManager.getSummary();

    if (summary.length === 0) {
      const noResources = this.scene.add.text(10, 50, "No resources yet", {
        fontSize: "14px",
        color: "#888",
      });
      this.container.add(noResources);
      return;
    }

    // Display resources
    summary.forEach((item, index) => {
      const y = 50 + index * 25;

      const text = this.scene.add.text(
        10,
        y,
        `${item.emoji} ${item.name}: ${item.total}`,
        {
          fontSize: "14px",
          color: "#fff",
        }
      );

      // Color code by amount
      if (item.total < 10) {
        text.setColor("#ff4444"); // Low - red
      } else if (item.total < 30) {
        text.setColor("#ffaa44"); // Medium - orange
      } else {
        text.setColor("#44ff44"); // Good - green
      }

      this.container.add(text);
      this.resourceTexts.set(item.resource, text);
    });
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.container.destroy();
  }
}

/**
 * Production indicator - shows what NPCs are producing
 */
export class ProductionIndicator {
  private scene: Phaser.Scene;
  private indicators: Map<string, Phaser.GameObjects.Container> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  showProduction(
    npcName: string,
    x: number,
    y: number,
    resource: ResourceType,
    amount: number
  ): void {
    // Remove old indicator if exists
    this.hideProduction(npcName);

    const container = this.scene.add.container(x, y);

    // Resource emoji
    const emoji = this.scene.add
      .text(0, -80, RESOURCE_INFO[resource].emoji, {
        fontSize: "24px",
      })
      .setOrigin(0.5);

    // Amount
    const amountText = this.scene.add
      .text(0, -100, `+${amount}`, {
        fontSize: "14px",
        color: "#44ff44",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    container.add([emoji, amountText]);
    this.indicators.set(npcName, container);

    // Animate and fade out
    this.scene.tweens.add({
      targets: container,
      y: y - 30,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        this.hideProduction(npcName);
      },
    });
  }

  hideProduction(npcName: string): void {
    const indicator = this.indicators.get(npcName);
    if (indicator) {
      indicator.destroy();
      this.indicators.delete(npcName);
    }
  }

  destroy(): void {
    this.indicators.forEach((indicator) => indicator.destroy());
    this.indicators.clear();
  }
}

/**
 * Storage building - clickable storage locations
 */
export class StorageBuilding {
  private scene: Phaser.Scene;
  private storage: ResourceStorage;
  private sprite: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private onClick?: (storage: ResourceStorage) => void;

  constructor(
    scene: Phaser.Scene,
    storage: ResourceStorage,
    x: number,
    y: number,
    onClick?: (storage: ResourceStorage) => void
  ) {
    this.scene = scene;
    this.storage = storage;
    this.onClick = onClick;

    // Building sprite (using emoji for now)
    this.sprite = scene.add
      .text(x, y, storage.emoji, {
        fontSize: "48px",
      })
      .setOrigin(0.5);

    // Name label
    this.nameText = scene.add
      .text(x, y + 30, storage.name, {
        fontSize: "14px",
        color: "#fff",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Make interactive
    this.sprite.setInteractive();
    this.sprite.on("pointerdown", () => {
      if (this.onClick) {
        this.onClick(this.storage);
      }
    });

    this.sprite.on("pointerover", () => {
      this.sprite.setScale(1.2);
      this.showCapacityBar();
    });

    this.sprite.on("pointerout", () => {
      this.sprite.setScale(1.0);
      this.hideCapacityBar();
    });
  }

  private capacityBar?: Phaser.GameObjects.Container;

  private showCapacityBar(): void {
    if (this.capacityBar) return;

    const total = Array.from(this.storage.inventory.values()).reduce(
      (a, b) => a + b,
      0
    );
    const fillPercent = total / this.storage.capacity;

    const container = this.scene.add.container(
      this.sprite.x,
      this.sprite.y + 50
    );

    // Background
    const bg = this.scene.add.rectangle(0, 0, 80, 8, 0x333333);

    // Fill
    const fill = this.scene.add.rectangle(
      -40 + (80 * fillPercent) / 2,
      0,
      80 * fillPercent,
      8,
      fillPercent > 0.8 ? 0xff4444 : fillPercent > 0.5 ? 0xffaa44 : 0x44ff44
    );

    // Text
    const text = this.scene.add
      .text(0, 15, `${total}/${this.storage.capacity}`, {
        fontSize: "10px",
        color: "#fff",
      })
      .setOrigin(0.5);

    container.add([bg, fill, text]);
    this.capacityBar = container;
  }

  private hideCapacityBar(): void {
    if (this.capacityBar) {
      this.capacityBar.destroy();
      this.capacityBar = undefined;
    }
  }

  destroy(): void {
    this.sprite.destroy();
    this.nameText.destroy();
    if (this.capacityBar) {
      this.capacityBar.destroy();
    }
  }
}

/**
 * Resource flow indicator - shows resources moving between locations
 */
export class ResourceFlowEffect {
  static showTransfer(
    scene: Phaser.Scene,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    resource: ResourceType,
    amount: number
  ): void {
    const emoji = scene.add
      .text(fromX, fromY, RESOURCE_INFO[resource].emoji, {
        fontSize: "20px",
      })
      .setOrigin(0.5);

    const amountText = scene.add
      .text(fromX, fromY + 20, `${amount}`, {
        fontSize: "12px",
        color: "#fff",
        backgroundColor: "#000",
        padding: { x: 3, y: 2 },
      })
      .setOrigin(0.5);

    // Animate from -> to
    scene.tweens.add({
      targets: [emoji, amountText],
      x: toX,
      y: toY,
      duration: 1000,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        emoji.destroy();
        amountText.destroy();
      },
    });
  }
}
