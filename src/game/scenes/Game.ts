import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { Turret } from '../entities/Turret';
import { Goblin } from '../entities/Goblin';
import { Slime } from '../entities/Slime';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';

export class Game extends Scene {
    private lives: number = 20;
    private money: number = 100;
    private camera: Phaser.Cameras.Scene2D.Camera;
    private wave: number = 0;
    private maxWaves: number = 3;
    private enemies: Enemy[] = [];
    private turrets: Turret[] = [];
    private towerPositions: Phaser.Math.Vector2[] = [];
    private enemyPath: Phaser.Math.Vector2[] = [];
    private waveInProgress: boolean = false;
    private waveCheckTimer?: Phaser.Time.TimerEvent;
    private player: Player;

    constructor() {
        super('Game');
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x000000);

        // Asegurarse de que el estado está limpio al iniciar
        this.resetGameState();
        
        this.setupPath();
        this.setupTowerPositions();
        
        // Crear el jugador
        this.player = new Player(this);

        // Configurar tecla ENTER para iniciar oleada
        const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        if (enterKey) {
            enterKey.on('down', () => {
                if (!this.waveInProgress) {
                    this.startWave();
                }
            });
        }

        // Notificar que estamos en la escena de juego
        window.dispatchEvent(new CustomEvent('gameSceneChange', { detail: 'Game' }));
        this.updateUI();

        // Event handler para cuando un enemigo llega al final
        this.events.on('enemyReachedEnd', (_enemy: Goblin) => {
            this.lives--;
            this.updateUI();
            
            if (this.lives <= 0) {
                this.cleanupScene();
                this.scene.start('GameOver');
            }
        });

        // Event handler para cuando el jugador recibe daño
        this.events.on('playerDamaged', () => {
            this.lives--;
            this.updateUI();
            
            if (this.lives <= 0) {
                this.cleanupScene();
                this.scene.start('GameOver');
            }
        });

        // Event handler para cuando un enemigo es eliminado
        this.events.on('enemyKilled', (_enemy: Goblin) => {
            this.money += 15; // Recompensa de 15 por matar un enemigo
            this.updateUI();
        });

        // Event handler para iniciar oleada desde el menú externo
        this.game.events.on('startWave', () => {
            this.startWave();
        });

        // Event handler para volver al menú desde el menú externo
        this.game.events.on('returnToMenu', () => {
            this.cleanupScene();
            window.dispatchEvent(new CustomEvent('gameSceneChange', { detail: 'MainMenu' }));
            this.scene.start('MainMenu');
        });

        // Event handler para reintentar desde el game over
        this.game.events.on('retry', () => {
            this.scene.start('Game');
        });

        EventBus.emit('current-scene-ready', this);
    }

    private cleanupScene() {
        // Remover todos los event listeners
        this.events.removeAllListeners('enemyReachedEnd');
        this.events.removeAllListeners('enemyKilled');
        this.game.events.removeListener('startWave');
        this.game.events.removeListener('returnToMenu');
        this.game.events.removeListener('retry');
        
        // Limpiar el event listener del teclado
        if (this.input.keyboard) {
            this.input.keyboard.removeKey('ENTER');
        }
        
        // Limpiar el jugador
        if (this.player) {
            this.player.destroy();
        }

        // Resetear el estado del juego
        this.resetGameState();
    }

    private setupPath() {
        // Definir el camino que seguirán los enemigos
        this.enemyPath = [
            new Phaser.Math.Vector2(0, 300),
            new Phaser.Math.Vector2(200, 300),
            new Phaser.Math.Vector2(200, 100),
            new Phaser.Math.Vector2(400, 100),
            new Phaser.Math.Vector2(400, 500),
            new Phaser.Math.Vector2(600, 500)
        ];

        // Dibujar el camino
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x333333);
        graphics.beginPath();
        graphics.moveTo(this.enemyPath[0].x, this.enemyPath[0].y);

        for (let i = 1; i < this.enemyPath.length; i++) {
            graphics.lineTo(this.enemyPath[i].x, this.enemyPath[i].y);
        }

        graphics.strokePath();
    } private setupTowerPositions() {
        // Definir posiciones posibles para las torres
        this.towerPositions = [
            new Phaser.Math.Vector2(250, 200),
            new Phaser.Math.Vector2(350, 200),
            new Phaser.Math.Vector2(250, 400),
            new Phaser.Math.Vector2(350, 400)
        ];

        // Mostrar las posiciones disponibles
        this.towerPositions.forEach(pos => {
            this.add.circle(pos.x, pos.y, 15, 0x333333)
                .setInteractive()
                .on('pointerdown', () => this.tryPlaceTurret(pos));
        });
    }

    private tryPlaceTurret(position: Phaser.Math.Vector2) {
        const turretCost = 50; // Costo base de una torreta

        if (this.money >= turretCost) {
            this.money -= turretCost;
            const turret = new Turret(this, position.x, position.y);
            this.turrets.push(turret);
            this.updateUI();
        }
    }

    private startWave() {
        if (this.wave >= this.maxWaves || this.waveInProgress) return;

        this.waveInProgress = true;
        this.wave++;
        const enemyCount = 5 + (this.wave * 2); // Aumenta la cantidad de enemigos por oleada
        this.updateUI();

        // Limpiar el temporizador anterior si existe
        if (this.waveCheckTimer) {
            this.waveCheckTimer.destroy();
        }

        // Spawner de enemigos
        let spawned = 0;
        const spawnInterval = this.time.addEvent({
            delay: 1000,
            callback: () => {
                // Alternar entre Goblin y Slime
                const enemy = Math.random() < 0.5 ? 
                    new Goblin(this, this.enemyPath) :
                    new Slime(this, this.enemyPath);
                this.enemies.push(enemy);
                spawned++;

                if (spawned >= enemyCount) {
                    spawnInterval.destroy();

                    // Configurar un temporizador para verificar cuando todos los enemigos han sido eliminados
                    this.waveCheckTimer = this.time.addEvent({
                        delay: 100,
                        callback: () => {
                            if (this.enemies.length === 0) {
                                this.waveInProgress = false;
                                this.updateUI();
                                // Limpiar el temporizador cuando la oleada termine
                                if (this.waveCheckTimer) {
                                    this.waveCheckTimer.destroy();
                                    this.waveCheckTimer = undefined;
                                }
                            }
                        },
                        loop: true
                    });
                }
            },
            repeat: enemyCount - 1
        });
    }

    private updateUI() {
        // Enviar actualización de stats al componente React
        window.dispatchEvent(new CustomEvent('gameStatsUpdate', {
            detail: {
                lives: this.lives,
                money: this.money,
                wave: this.wave,
                maxWaves: this.maxWaves,
                waveInProgress: this.waveInProgress
            }
        }));
    }

    private resetGameState() {
        // Reiniciar variables básicas
        this.lives = 20;
        this.money = 100;
        this.wave = 0;
        this.waveInProgress = false;

        // Limpiar enemigos
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];

        // Limpiar torretas
        this.turrets.forEach(turret => turret.destroy());
        this.turrets = [];

        // Limpiar temporizadores
        if (this.waveCheckTimer) {
            this.waveCheckTimer.destroy();
            this.waveCheckTimer = undefined;
        }

        // Actualizar UI
        this.updateUI();
    }

    update(time: number, delta: number) {
        // Actualizar el jugador
        if (this.player) {
            this.player.update(delta, time, this.enemies);
        }

        // Actualizar las torretas
        this.turrets.forEach(turret => {
            turret.update(time, this.enemies);
        });

        // Limpiar enemigos destruidos
        this.enemies = this.enemies.filter(enemy => enemy.active);
    }
}
