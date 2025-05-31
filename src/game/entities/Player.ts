import { Scene } from 'phaser';
import { Enemy } from './Enemy';
import { Game } from '../scenes/Game';

export class Player extends Phaser.GameObjects.Container {
    private sprite: Phaser.GameObjects.Sprite;
    private moveSpeed: number = 200;
    private bounds: Phaser.Geom.Rectangle;
    private range: number = 75; // La mitad del rango de las torretas (150/2)
    private fireRate: number = 1000; // mismo rate que las torretas
    private lastShot: number = 0;
    private isInvulnerable: boolean = false;
    private invulnerabilityTimer?: Phaser.Time.TimerEvent;
    private blinkEffect?: Phaser.Tweens.Tween;
    private currentDirection: 'up' | 'down' | 'side' = 'side';
    private isAttacking: boolean = false;
    private isDying: boolean = false;
    private cursors: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };

    constructor(scene: Scene) {
        const centerX = scene.cameras.main.width / 2;
        const centerY = scene.cameras.main.height / 2;
        super(scene, centerX, centerY);
        
        // Crear sprite del jugador y establecer la animación inicial
        this.sprite = scene.add.sprite(0, 0, 'player-fly-side');
        this.sprite.setScale(1); // Aumentamos el tamaño
        this.add(this.sprite);
        
        // Crear animaciones
        this.createAnimations();
        
        // Configurar los límites de la pantalla
        const width = scene.cameras.main.width;
        const height = scene.cameras.main.height;
        const halfSize = 48; // Mitad del tamaño del sprite (96/2)
        this.bounds = new Phaser.Geom.Rectangle(
            halfSize,
            halfSize,
            width - halfSize - 30,
            height - halfSize - 50
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

    private createAnimations(): void {
        if (!this.scene) return;

        const directions = ['down', 'side', 'up'] as const;
        const types = ['fly', 'attack', 'death'] as const;

        for (const type of types) {
            for (const direction of directions) {
                const key = `player-${type}-${direction}`;
                
                // Solo crear la animación si no existe
                if (!this.scene.anims.exists(key)) {
                    this.scene.anims.create({
                        key: key,
                        frames: this.scene.anims.generateFrameNumbers(`player-${type}-${direction}`, { 
                            start: 0,
                            end: 5
                        }),
                        frameRate: 10,
                        repeat: type === 'fly' ? -1 : 0
                    });
                }
            }
        }
    }

    private checkEnemyCollisions(enemies: Enemy[]): void {
        if (this.isInvulnerable) return;

        for (const enemy of enemies) {
            const distance = Phaser.Math.Distance.Between(
                this.x,
                this.y,
                enemy.x,
                enemy.y
            );

            if (distance < 48) // Radio de colisión ajustado para sprite de 96x96 con escala 0.75
            {
                this.takeDamage();
                break;
            }
        }
    }

    private takeDamage(): void {
        if (this.isInvulnerable) return;

        // Notificar a la escena del daño
        this.scene.events.emit('playerDamaged');
        
        // Activar invulnerabilidad
        this.isInvulnerable = true;

        // Crear efecto de parpadeo
        this.blinkEffect = this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 100,
            yoyo: true,
            repeat: 19, // 10 parpadeos en 2 segundos
            ease: 'Linear'
        });

        // Timer para desactivar la invulnerabilidad
        this.invulnerabilityTimer = this.scene.time.delayedCall(2000, () => {
            this.isInvulnerable = false;
            if (this.blinkEffect && this.blinkEffect.isPlaying()) {
                this.blinkEffect.stop();
            }
            this.sprite.setAlpha(1);
        });
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

    private shoot(target: Enemy, enemies: Enemy[]): void {
        // Comenzar animación de ataque
        this.isAttacking = true;
        const attackAnim = `player-attack-${this.currentDirection}`;
        
        // Asegurarse de que el sprite esté volteado correctamente para el ataque
        if (this.currentDirection === 'side') {
            this.sprite.setFlipX(target.x > this.x);
        }
        
        this.sprite.play(attackAnim);
        
        // Calcular la dirección del proyectil
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        const velocity = 300; // Velocidad más baja para el proyectil
        const velocityX = Math.cos(angle) * velocity;
        const velocityY = Math.sin(angle) * velocity;
        
        // Crear y lanzar proyectil
        const bullet = this.scene.add.image(this.x, this.y, 'player-projectile-1');
        bullet.setScale(0.5);
        
        // Función para verificar colisión con enemigo
        const checkEnemyCollision = () => {
            if (!bullet.active) return;
            
            for (const enemy of enemies) {
                if (!enemy.active) continue;
                
                const distance = Phaser.Math.Distance.Between(
                    bullet.x,
                    bullet.y,
                    enemy.x,
                    enemy.y
                );
                
                if (distance < 32) {
                    bullet.destroy();
                    enemy.damage(1);
                    break;
                }
            }
        };
        
        // Configurar el movimiento del proyectil
        this.scene.tweens.add({
            targets: bullet,
            x: this.x + velocityX * 2, // 2 segundos de viaje
            y: this.y + velocityY * 2,
            duration: 2000,
            ease: 'Linear',
            onComplete: () => bullet.destroy(),
            onUpdate: checkEnemyCollision
        });

        // Cuando termine la animación de ataque, volver a la animación de vuelo
        this.sprite.once('animationcomplete', () => {
            this.isAttacking = false;
            this.sprite.play(`player-fly-${this.currentDirection}`, true);
        });
    }

    public update(delta: number, time: number, enemies: Enemy[]): void {
        if (!this.cursors || this.isDying) return;

        let newX = this.x;
        let newY = this.y;
        let movementModifier = this.isInvulnerable ? 0.50 : (this.isAttacking ? 0.75 : 1);

        // Calcular movimiento
        let velocityX = 0;
        let velocityY = 0;

        // Detectar la última tecla presionada y aplicar solo ese movimiento
        if (this.cursors.left.isDown) {
            velocityX = -1;
            newX -= (this.moveSpeed * movementModifier) * (delta / 1000);
        }
        else if (this.cursors.right.isDown) {
            velocityX = 1;
            newX += (this.moveSpeed * movementModifier) * (delta / 1000);
        }
        // Solo procesar movimiento vertical si no hay movimiento horizontal
        else if (this.cursors.up.isDown) {
            velocityY = -1;
            newY -= (this.moveSpeed * movementModifier) * (delta / 1000);
        }
        else if (this.cursors.down.isDown) {
            velocityY = 1;
            newY += (this.moveSpeed * movementModifier) * (delta / 1000);
        }

        // Actualizar dirección y animación del sprite
        this.updateSpriteDirection(velocityX, velocityY);

        // Aplicar restricciones de límites
        this.x = Phaser.Math.Clamp(newX, this.bounds.left, this.bounds.right);
        this.y = Phaser.Math.Clamp(newY, this.bounds.top, this.bounds.bottom);

        // Verificar colisiones con enemigos
        this.checkEnemyCollisions(enemies);

        // Verificar colisiones con posiciones de torres
        (this.scene as Game).checkTowerPositionCollision(this.x, this.y);

        // Sistema de disparo automático
        const target = this.findNearestEnemy(enemies);
        if (target && time > this.lastShot + this.fireRate) {
            this.shoot(target, enemies);
            this.lastShot = time;
        }
    }

    private updateSpriteDirection(velocityX: number, velocityY: number): void {
        if (velocityX === 0 && velocityY === 0) return;

        // Determinar la dirección principal del movimiento
        const absX = Math.abs(velocityX);
        const absY = Math.abs(velocityY);
        
        if (absX > absY) {
            this.currentDirection = 'side';
            this.sprite.setFlipX(velocityX > 0); // Invertimos la lógica aquí
        } else {
            this.currentDirection = velocityY > 0 ? 'down' : 'up';
            this.sprite.setFlipX(false);
        }

        if (!this.isAttacking) {
            this.sprite.play(`player-fly-${this.currentDirection}`, true);
        }
    }

    public destroy(fromScene?: boolean): void {
        if (this.isDying) return; // Evitar múltiples llamadas a destroy
        this.isDying = true;

        if (this.blinkEffect && this.blinkEffect.isPlaying()) {
            this.blinkEffect.stop();
        }
        if (this.invulnerabilityTimer && this.invulnerabilityTimer.getProgress() < 1) {
            this.invulnerabilityTimer.destroy();
        }

        // Reproducir la animación de muerte en la dirección actual
        const deathAnim = `player-death-${this.currentDirection}`;
        this.sprite.play(deathAnim);

        // Esperar a que termine la animación antes de destruir
        this.sprite.once('animationcomplete', () => {
            super.destroy(fromScene);
        });
    }
}
