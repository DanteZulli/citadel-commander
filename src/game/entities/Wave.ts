import { Scene } from 'phaser';
import { Enemy } from './Enemy';
import { Goblin } from './Goblin';
import { Slime } from './Slime';
import { Wolf } from './Wolf';

export interface EnemyWeight {
    type: typeof Goblin | typeof Slime | typeof Wolf;
    weight: number;
}

export interface WaveConfig {
    enemyCount: number;
    spawnInterval: number;
    enemyWeights: EnemyWeight[];
}

export class Wave {
    private scene: Scene;
    private enemyPath: Phaser.Math.Vector2[];
    private config: WaveConfig;
    private enemiesSpawned: number = 0;
    private spawnTimer?: Phaser.Time.TimerEvent;
    private enemies: Enemy[] = [];
    private onWaveComplete?: () => void;
    private isCompleted: boolean = false;

    constructor(scene: Scene, path: Phaser.Math.Vector2[], config: WaveConfig) {
        this.scene = scene;
        this.enemyPath = path;
        this.config = config;
    }

    public start(onComplete?: () => void): void {
        this.onWaveComplete = onComplete;
        this.spawnTimer = this.scene.time.addEvent({
            delay: this.config.spawnInterval,
            callback: this.spawnEnemy,
            callbackScope: this,
            repeat: this.config.enemyCount - 1
        });
    }

    public stop(): void {
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
            this.spawnTimer = undefined;
        }
    }

    public getActiveEnemies(): Enemy[] {
        return this.enemies.filter(enemy => enemy.active);
    }

    public isComplete(): boolean {
        return this.isCompleted;
    }

    private spawnEnemy(): void {
        const EnemyType = this.selectEnemyType();
        const enemy = new EnemyType(this.scene, this.enemyPath);
        this.enemies.push(enemy);
        this.enemiesSpawned++;

        // Clear destroyed enemies and check for wave completion
        this.checkWaveCompletion();
    }

    private checkWaveCompletion(): void {
        // Remove destroyed enemies from our array
        this.enemies = this.enemies.filter(enemy => enemy.active);

        // Wave is complete when all enemies have been spawned AND all are destroyed
        if (this.enemiesSpawned >= this.config.enemyCount && this.enemies.length === 0) {
            // Stop the spawn timer if it's still running
            this.stop();
            // Notify wave completion
            this.onWaveComplete?.();
        }
    }

    public update(): void {
        // Check completion on each update in case enemies are destroyed between spawns
        this.checkWaveCompletion();
        if (this.enemiesSpawned >= this.config.enemyCount && this.getActiveEnemies().length === 0) {
            this.isCompleted = true;
        }
    }

    private selectEnemyType(): typeof Goblin | typeof Slime | typeof Wolf {
        const totalWeight = this.config.enemyWeights.reduce((sum, entry) => sum + entry.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const entry of this.config.enemyWeights) {
            random -= entry.weight;
            if (random <= 0) {
                return entry.type;
            }
        }

        // Fallback to first enemy type if something goes wrong
        return this.config.enemyWeights[0].type;
    }
}
