import { Scene } from 'phaser';
import { Enemy } from './Enemy';

export class Goblin extends Enemy {
    constructor(scene: Scene, path: Phaser.Math.Vector2[]) {
        super(scene, path, {
            health: 2,
            speed: 80,
            scale: 1.5,
            spriteSheets: {
                walk: {
                    down: 'goblin-walk-down',
                    side: 'goblin-walk-side',
                    up: 'goblin-walk-up'
                },
                death: {
                    down: 'goblin-death-down',
                    side: 'goblin-death-side',
                    up: 'goblin-death-up'
                }
            }
        });
    }
}
