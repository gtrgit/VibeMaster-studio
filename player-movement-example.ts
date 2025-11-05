// Player Movement Implementation Example
// Add this to your GameScene class in src/main.ts

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private playerSpeed: number = 200; // pixels per second

  create() {
    // ... existing create code ...

    // Create player sprite
    this.createPlayer();
    
    // Setup input controls
    this.setupPlayerControls();
    
    // Setup camera to follow player
    this.setupCameraFollow();
  }

  private createPlayer() {
    // Create player at center of world
    this.player = this.add.sprite(800, 500, "characters", 0); // Use frame 0 for player
    this.player.setScale(SPRITE_CONFIG.displayScale);
    this.player.setTint(0x00ff00); // Green tint to distinguish from NPCs
    
    // Enable physics if you want collision
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
  }

  private setupPlayerControls() {
    // Setup cursor keys (arrow keys)
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Setup WASD keys
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  private setupCameraFollow() {
    // Camera follows player with smooth following
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
    this.cameras.main.setZoom(1);
    
    // Keep camera within world bounds
    this.cameras.main.setBounds(0, 0, 1600, 1000);
  }

  update(time: number, delta: number) {
    // ... existing update code ...
    
    this.updatePlayerMovement(delta);
  }

  private updatePlayerMovement(delta: number) {
    if (!this.player || !this.player.body) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    
    // Reset velocity
    body.setVelocity(0);

    // Handle horizontal movement
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      body.setVelocityX(-this.playerSpeed);
      this.player.setFlipX(true); // Face left
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      body.setVelocityX(this.playerSpeed);
      this.player.setFlipX(false); // Face right
    }

    // Handle vertical movement
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      body.setVelocityY(-this.playerSpeed);
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      body.setVelocityY(this.playerSpeed);
    }

    // Normalize diagonal movement
    if (body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(this.playerSpeed);
    }
  }

  // Add collision with NPCs
  private setupCollisions() {
    // This would go in create() after creating player and NPCs
    this.npcSprites.forEach(npcSprite => {
      this.physics.add.collider(this.player, npcSprite, () => {
        console.log("Player collided with NPC!");
        // Add interaction logic here
      });
    });
  }

  // Method to get player position for other systems
  public getPlayerPosition(): { x: number; y: number } {
    if (!this.player) return { x: 0, y: 0 };
    return { x: this.player.x, y: this.player.y };
  }
}

// Additional configuration needed in your Phaser config:
const config: Phaser.Types.Core.GameConfig = {
  // ... existing config ...
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // Top-down game, no gravity
      debug: false // Set to true for debugging collision boxes
    }
  }
};