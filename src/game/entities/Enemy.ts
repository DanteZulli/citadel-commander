import { Scene } from 'phaser';

export abstract class Enemy extends Phaser.GameObjects.Container {
    protected health: number;
    protected speed: number;
    protected path: Phaser.Math.Vector2[];
    protected currentPathIndex: number = 0;
    protected sprite: Phaser.GameObjects.Sprite;
    protected currentTween?: Phaser.Tweens.Tween;
    protected currentDirection: 'up' | 'down' | 'side' = 'side';
    
    // Nombres de las texturas de sprites que se usarán para las animaciones
    protected spriteSheets: {
        walk: {
            down: string;
            side: string;
            up: string;
        };
        death: {
            down: string;
            side: string;
            up: string;
        };
    };

    protected updateSpriteDirection(fromX: number, fromY: number, toX: number, toY: number): void {
        // Calculate movement angle
        const angleRad = Math.atan2(toY - fromY, toX - fromX);
        const angleDeg = Phaser.Math.RadToDeg(angleRad);
        
        // Get primary movement direction using wider angles for horizontal movement
        const absAngle = Math.abs(angleDeg);
        const horizontalMovement = absAngle < 67.5 || absAngle > 112.5;
        
        if (horizontalMovement) {
            this.currentDirection = 'side';
            // Si el ángulo está entre -180 y 0, va hacia la izquierda, sino hacia la derecha
            this.sprite.setFlipX(angleDeg < 0);
        } else {
            // Movimiento vertical
            this.currentDirection = angleDeg > 0 ? 'down' : 'up';
            this.sprite.setFlipX(false);
        }
        
        // Get enemy type and play the corresponding animation
        const enemyType = this.spriteSheets.walk.down.split('-')[0];
        this.sprite.play(`${enemyType}-walk-${this.currentDirection}`, true);
    }
    
    protected createAnimations(): void {
        if (!this.scene) return;

        const directions = ['down', 'side', 'up'] as const;
        const types = ['walk', 'death'] as const;

        // Get enemy type from the sprite key (e.g., 'goblin-walk-down' -> 'goblin')
        const enemyType = this.spriteSheets.walk.down.split('-')[0];
        
        for (const type of types) {
            for (const direction of directions) {
                const key = `${enemyType}-${type}-${direction}`;
                const spriteKey = this.spriteSheets[type][direction];
                
                // Only create animation if it doesn't exist
                if (!this.scene.anims.exists(key)) {
                    this.scene.anims.create({
                        key: key,
                        frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 5 }),
                        frameRate: 10,
                        repeat: type === 'walk' ? -1 : 0
                    });
                }
            }
        }
    }

    constructor(
        scene: Scene, 
        path: Phaser.Math.Vector2[],
        config: {
            health: number;
            speed: number;
            scale?: number;
            spriteSheets: {
                walk: { down: string; side: string; up: string; };
                death: { down: string; side: string; up: string; };
            };
        }
    ) {
        super(scene, path[0].x, path[0].y);
        
        this.path = path;
        this.health = config.health;
        this.speed = config.speed;
        this.spriteSheets = config.spriteSheets;
        
        // Create sprite with side walk as default
        this.sprite = scene.add.sprite(0, 0, this.spriteSheets.walk.side);
        this.sprite.setScale(config.scale || 1);
        this.add(this.sprite);
        
        this.createAnimations();
        
        // Determine initial direction based on first movement
        if (path.length > 1) {
            const firstPoint = path[0];
            const secondPoint = path[1];
            this.updateSpriteDirection(firstPoint.x, firstPoint.y, secondPoint.x, secondPoint.y);
        }
        
        scene.add.existing(this);
        this.moveToNextPoint();
    }    public damage(amount: number): void {
        this.health -= amount;
        if (this.health <= 0) {
            // Stop current movement
            if (this.currentTween) {
                this.currentTween.stop();
                this.currentTween = undefined;
            }

            // Get enemy type and play death animation
            const enemyType = this.spriteSheets.walk.down.split('-')[0];
            const deathAnim = `${enemyType}-death-${this.currentDirection}`;
            this.sprite.play(deathAnim);
            
            // Wait for death animation to complete before destroying
            this.sprite.once('animationcomplete', () => {
                if (this.scene) {
                    this.scene.events.emit('enemyKilled', this);
                }
                this.destroy();
            });
        }
    }
    
    protected moveToNextPoint(): void {
        // Check if enemy is destroyed
        if (!this.scene || !this.active) return;

        if (this.currentPathIndex >= this.path.length - 1) {
            // Enemy reached the end of path
            this.scene.events.emit('enemyReachedEnd', this);
            this.destroy();
            return;
        }
        
        const nextPoint = this.path[this.currentPathIndex + 1];
        const distance = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            nextPoint.x,
            nextPoint.y
        );

        // Update sprite direction based on movement
        this.updateSpriteDirection(this.x, this.y, nextPoint.x, nextPoint.y);
        
        this.currentTween = this.scene.tweens.add({
            targets: this,
            x: nextPoint.x,
            y: nextPoint.y,
            duration: (distance / this.speed) * 1000,
            onComplete: () => {
                // Check if enemy still exists before continuing
                if (this.scene && this.active) {
                    this.currentPathIndex++;
                    this.moveToNextPoint();
                }
            }
        });
    }
}
