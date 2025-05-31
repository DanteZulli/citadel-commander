import { Scene } from 'phaser';

export class Turret extends Phaser.GameObjects.Container {
    private range: number = 150;
    private fireRate: number = 1000; // disparos por segundo
    private lastShot: number = 0;
    private cost: number = 50;
    
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y);
        
        // Crear representación visual simple de la torreta (círculo con línea)
        const base = scene.add.circle(0, 0, 15, 0x333333);
        const cannon = scene.add.rectangle(0, 0, 5, 20, 0xffffff);
        cannon.setOrigin(0.5, 1);
        
        this.add([base, cannon]);
        scene.add.existing(this);
    }
    
    public getCost(): number {
        return this.cost;
    }
    
    public update(time: number, enemies: Phaser.GameObjects.GameObject[]): void {
        // Encontrar el enemigo más cercano dentro del rango
        const target = this.findNearestEnemy(enemies);
        
        if (target) {
            // Rotar hacia el enemigo
            const angle = Phaser.Math.Angle.Between(
                this.x, 
                this.y, 
                target.x, 
                target.y
            );
            this.rotation = angle;
            
            // Disparar si ha pasado suficiente tiempo
            if (time > this.lastShot + this.fireRate) {
                this.shoot(target);
                this.lastShot = time;
            }
        }
    }
    
    private findNearestEnemy(enemies: Phaser.GameObjects.GameObject[]): any {
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
      private shoot(target: any): void {
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
                    target.damage(1);
                }
            }
        });
    }
}
