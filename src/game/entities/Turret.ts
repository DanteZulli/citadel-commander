import { Scene } from 'phaser';
import { Enemy } from './Enemy';

interface TurretConfig {
    level: 1 | 2 | 3;
    cost: number;
    range: number;
    fireRate: number;
    damage: number;
}

const TURRET_CONFIGS: { [key: number]: TurretConfig } = {
    1: { level: 1, cost: 30, range: 150, fireRate: 1000, damage: 1 },
    2: { level: 2, cost: 60, range: 200, fireRate: 800, damage: 2 },
    3: { level: 3, cost: 120, range: 250, fireRate: 600, damage: 3 }
};

export class Turret extends Phaser.GameObjects.Container {
    private range: number;
    private fireRate: number;
    private lastShot: number = 0;
    private cost: number;
    private damage: number;
    private level: number;
    private sprite: Phaser.GameObjects.Sprite;
    
    constructor(scene: Scene, x: number, y: number, level: 1 | 2 | 3 = 1) {
        super(scene, x, y);
        
        const config = TURRET_CONFIGS[level];
        this.level = level;
        this.range = config.range;
        this.fireRate = config.fireRate;
        this.damage = config.damage;
        this.cost = config.cost;

        // Play build sound
        scene.sound.play('turret-build');

        // Crear sprite y animación idle
        this.sprite = scene.add.sprite(0, 0, `tower-idle-${level}`);
        this.sprite.setOrigin(0.5, 1);
        this.add(this.sprite);

        // Crear animación idle
        const idleKey = `tower-idle-${level}-anim`;
        if (!scene.anims.exists(idleKey)) {
            scene.anims.create({
                key: idleKey,
                frames: scene.anims.generateFrameNumbers(`tower-idle-${level}`, { 
                    start: 0, 
                    end: 5 
                }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        this.sprite.play(idleKey);
        scene.add.existing(this);
    }

    public upgrade(): boolean {
        if (this.level >= 3) return false;
        
        const nextLevel = this.level + 1 as 1 | 2 | 3;
        const nextConfig = TURRET_CONFIGS[nextLevel];

        // Play upgrade sound
        this.scene.sound.play('turret-upgrade');

        // Detener cualquier animación actual
        this.sprite.stop();

        // Crear animación de mejora si no existe
        const upgradeKey = `tower-upgrade-${this.level}-to-${nextLevel}-anim`;
        if (!this.scene.anims.exists(upgradeKey)) {
            this.scene.anims.create({
                key: upgradeKey,
                frames: this.scene.anims.generateFrameNumbers(`tower-upgrade-${this.level}`, {
                    start: 0,
                    end: 5
                }),
                frameRate: 10,
                repeat: 0
            });
        }

        // Crear la nueva animación idle si no existe
        const nextIdleKey = `tower-idle-${nextLevel}-anim`;
        if (!this.scene.anims.exists(nextIdleKey)) {
            this.scene.anims.create({
                key: nextIdleKey,
                frames: this.scene.anims.generateFrameNumbers(`tower-idle-${nextLevel}`, { 
                    start: 0, 
                    end: 5 
                }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Reproducir animación de mejora
        console.log('Reproduciendo animación de mejora:', upgradeKey); // Debug
        this.sprite.play(upgradeKey);
        
        // Cuando termine la animación de mejora, actualizar stats y cambiar a idle
        this.sprite.once('animationcomplete', () => {
            console.log('Animación de mejora completada, actualizando a nivel:', nextLevel); // Debug
            this.level = nextLevel;
            this.range = nextConfig.range;
            this.fireRate = nextConfig.fireRate;
            this.damage = nextConfig.damage;
            
            // Cambiar a la nueva textura y animación
            this.sprite.setTexture(`tower-idle-${nextLevel}`);
            this.sprite.play(nextIdleKey);
        });

        return true;

        return true;
    }
    
    public getCost(): number {
        return this.cost;
    }
    
    public update(time: number, enemies: Enemy[]): void {
        // Encontrar el enemigo más cercano dentro del rango
        const target = this.findNearestEnemy(enemies);
        
        if (target && time > this.lastShot + this.fireRate) {
            this.shoot(target);
            this.lastShot = time;
        }
    }
    
    private findNearestEnemy(enemies: Enemy[]): Enemy | null {
        let nearestEnemy = null;
        let nearestDistance = this.range;
        
        enemies.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(
                this.x,
                this.y,
                enemy.x,
                enemy.y
            );
            
            if (distance <= this.range && distance < nearestDistance) {
                nearestEnemy = enemy;
                nearestDistance = distance;
            }
        });
        
        return nearestEnemy;
    }
    
    private shoot(target: Enemy): void {
        // Play shoot sound
        this.scene.sound.play('turret-shoot');
        
        // Crear un proyectil simple
        const bullet = this.scene.add.circle(this.x, this.y, 3, 0xffffff);
        
        // Animar el proyectil hacia el enemigo
        this.scene.tweens.add({
            targets: bullet,
            x: target.x,
            y: target.y,
            duration: 200,
            onComplete: () => {
                bullet.destroy();
                // Verificar que el enemigo aún existe antes de dañarlo
                if (target && target.active && target.damage) {
                    target.damage(this.damage);
                }
            }
        });
    }
    
    public getUpgradeCost(): number {
        if (this.level >= 3) return 0;
        return TURRET_CONFIGS[this.level + 1].cost;
    }
    
    public getLevel(): number {
        return this.level;
    }
}
