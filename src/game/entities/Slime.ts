import { Scene } from 'phaser';
import { Enemy } from './Enemy';

export class Slime extends Enemy {
    constructor(scene: Scene, path: Phaser.Math.Vector2[]) {
        super(scene, path, {
            health: 4,
            speed: 60,
            scale: 1.2,
            spriteSheets: {
                walk: {
                    down: 'slime-walk-down',
                    side: 'slime-walk-side',
                    up: 'slime-walk-up'
                },
                death: {
                    down: 'slime-death-down',
                    side: 'slime-death-side',
                    up: 'slime-death-up'
                }
            }
        });
    }
}
