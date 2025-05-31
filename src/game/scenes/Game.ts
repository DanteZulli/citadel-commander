import { Scene } from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Goblin } from '../entities/Goblin';
import { Slime } from '../entities/Slime';
import { Wolf } from '../entities/Wolf';
import { Wave, WaveConfig } from '../entities/Wave';
import { Player } from '../entities/Player';
import { Turret } from '../entities/Turret';
import { EventBus } from '../EventBus';
import { GUI } from '../entities/GUI';

export class Game extends Scene {
    private lives: number = 20;
    private money: number = 100;
    private camera: Phaser.Cameras.Scene2D.Camera;
    private wave: number = 0;
    private maxWaves: number = 3;
    private currentWave?: Wave;
    private turrets: Turret[] = [];
    private towerPositions: Phaser.Math.Vector2[] = [];
    private enemyPath: Phaser.Math.Vector2[] = [];
    private waveInProgress: boolean = false;
    private player: Player;
    private gui: GUI;

    // Wave configurations
    private readonly waveConfigs: WaveConfig[] = [
        {
            // Wave 1: Mostly slimes with some goblins
            enemyCount: 10,
            spawnInterval: 1200,
            enemyWeights: [
                { type: Slime, weight: 0.7 },
                { type: Goblin, weight: 0.3 }
            ]
        },
        {
            // Wave 2: Mix of all enemies, more goblins
            enemyCount: 15,
            spawnInterval: 1000,
            enemyWeights: [
                { type: Slime, weight: 0.3 },
                { type: Goblin, weight: 0.5 },
                { type: Wolf, weight: 0.2 }
            ]
        },
        {
            // Wave 3: Harder wave with more wolves
            enemyCount: 20,
            spawnInterval: 800,
            enemyWeights: [
                { type: Slime, weight: 0.2 },
                { type: Goblin, weight: 0.3 },
                { type: Wolf, weight: 0.5 }
            ]
        }
    ];

    constructor() {
        super('Game');
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x000000);
        
        this.setupPath();
        this.setupTowerPositions();
        
        // Crear el jugador
        this.player = new Player(this);

        // Crear el GUI
        this.gui = new GUI(this);

        // Asegurarse de que el estado está limpio al iniciar
        this.resetGameState();

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

        // Limpiar el GUI
        if (this.gui) {
            this.gui.destroy();
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
        this.updateUI();

        // Create and start new wave
        this.currentWave = new Wave(this, this.enemyPath, this.waveConfigs[this.wave - 1]);
        this.currentWave.start(() => {
            this.waveInProgress = false;
            this.updateUI();
            
            // Check if there are more waves to start
            if (this.wave < this.maxWaves) {
                // Add a delay between waves
                this.time.delayedCall(2000, () => {
                    this.startWave();
                });
            } else {
                // Game completed!
                this.time.delayedCall(1000, () => {
                    this.cleanupScene();
                    this.scene.start('GameOver');
                });
            }
        });
    }

    private updateUI() {
        // Actualizar el GUI en la escena si existe
        if (this.gui) {
            this.gui.updateStats(this.lives, this.money, this.wave, this.maxWaves);
        }

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

        // Stop current wave if exists
        if (this.currentWave) {
            this.currentWave.stop();
            this.currentWave = undefined;
        }

        // Limpiar torretas
        this.turrets.forEach(turret => turret.destroy());
        this.turrets = [];

        // Actualizar UI
        this.updateUI();
    }

    update(time: number, delta: number) {
        // Actualizar la wave actual
        if (this.currentWave) {
            this.currentWave.update();
        }

        // Actualizar el jugador
        if (this.player) {
            this.player.update(delta, time, this.currentWave ? this.currentWave.getActiveEnemies() : []);
        }

        // Actualizar las torretas
        this.turrets.forEach(turret => {
            if (this.currentWave) {
                turret.update(time, this.currentWave.getActiveEnemies());
            }
        });
    }
}
