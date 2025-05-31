import { Scene } from 'phaser';
import { Enemy } from './Enemy';

export class Player extends Phaser.GameObjects.Container {
    private sprite: Phaser.GameObjects.Rectangle;
    private moveSpeed: number = 200;
    private bounds: Phaser.Geom.Rectangle;
    private range: number = 75; // La mitad del rango de las torretas (150/2)
    private fireRate: number = 1000; // mismo rate que las torretas
    private lastShot: number = 0;
    private cursors: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };

    constructor(scene: Scene) {
        // Posicionar en el centro de la pantalla
        const centerX = scene.cameras.main.width / 2;
        const centerY = scene.cameras.main.height / 2;
        super(scene, centerX, centerY);
        
        // Crear un rectángulo azul como representación temporal
        this.sprite = scene.add.rectangle(0, 0, 32, 32, 0x0000ff);
        this.add(this.sprite);
        
        // Configurar los límites de la pantalla
        const width = scene.cameras.main.width;
        const height = scene.cameras.main.height;
        const halfSize = 16; // Mitad del tamaño del sprite (32/2)
        this.bounds = new Phaser.Geom.Rectangle(
            halfSize,          // x mínima
            halfSize,          // y mínima
            width - halfSize,  // x máxima
            height - halfSize  // y máxima
        );
        
        // Configurar teclas WASD
        const keyboard = scene.input.keyboard;
        if (keyboard) {
            this.cursors = {
                up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
        }
        
        scene.add.existing(this);
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
        // Crear un proyectil simple
        const bullet = this.scene.add.circle(this.x, this.y, 3, 0x00ffff); // Color cyan para diferenciarlo
        
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

    public update(delta: number, time: number, enemies: Enemy[]): void {
        if (!this.cursors) return;

        let newX = this.x;
        let newY = this.y;

        // Calcular nuevo movimiento en X
        if (this.cursors.left.isDown) {
            newX -= this.moveSpeed * (delta / 1000);
        } else if (this.cursors.right.isDown) {
            newX += this.moveSpeed * (delta / 1000);
        }

        // Calcular nuevo movimiento en Y
        if (this.cursors.up.isDown) {
            newY -= this.moveSpeed * (delta / 1000);
        } else if (this.cursors.down.isDown) {
            newY += this.moveSpeed * (delta / 1000);
        }

        // Aplicar restricciones de límites
        this.x = Phaser.Math.Clamp(newX, this.bounds.left, this.bounds.right);
        this.y = Phaser.Math.Clamp(newY, this.bounds.top, this.bounds.bottom);

        // Sistema de disparo automático
        const target = this.findNearestEnemy(enemies);
        if (target && time > this.lastShot + this.fireRate) {
            this.shoot(target);
            this.lastShot = time;
        }
    }
}
