import { Scene } from 'phaser';
import { Enemy } from './Enemy';

export class Wolf extends Enemy {
    constructor(scene: Scene, path: Phaser.Math.Vector2[]) {
        super(scene, path, {
            health: 3,         // Less health as it's a fast enemy
            speed: 120,        // Faster than both Goblin (80) and Slime (60)
            scale: 1.3,        // Slightly smaller than Goblin but larger than Slime
            spriteSheets: {
                walk: {
                    down: 'wolf-walk-down',
                    side: 'wolf-walk-side',
                    up: 'wolf-walk-up'
                },
                death: {
                    down: 'wolf-death-down',
                    side: 'wolf-death-side',
                    up: 'wolf-death-up'
                }
            }
        });
    }
}
