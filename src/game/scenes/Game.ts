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

    create() {        this.camera = this.cameras.main;
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
    }    private towerMenu?: {
        bg: Phaser.GameObjects.Rectangle;
        text: Phaser.GameObjects.Text;
        preview: Phaser.GameObjects.Sprite;
        position: Phaser.Math.Vector2;
        cleanupListeners: () => void;
    };

    private towerSpots: Phaser.GameObjects.Sprite[] = [];

    private setupTowerPositions() {
        // Definir posiciones posibles para las torres
        this.towerPositions = [
            // Torre a la izquierda del primer tramo horizontal
            new Phaser.Math.Vector2(150, 150),
            // Torre a la derecha del primer tramo horizontal
            new Phaser.Math.Vector2(450, 150),
            // Torre cerca del inicio del camino
            new Phaser.Math.Vector2(100, 380),
            // Torre cerca del final del camino
            new Phaser.Math.Vector2(550, 450)
        ];

        // Crear sprites para lugares de construcción
        this.towerPositions.forEach(pos => {
            const spot = this.add.sprite(pos.x, pos.y, 'tower-spot');
            spot.setData('position', pos);
            this.towerSpots.push(spot);
        });
    }

    public checkTowerPositionCollision(playerX: number, playerY: number): void {
        let playerOnTowerSpot = false;
        
        for (const pos of this.towerPositions) {
            const distance = Phaser.Math.Distance.Between(playerX, playerY, pos.x, pos.y);
            if (distance < 30) { // Radio de colisión
                playerOnTowerSpot = true;
                if (!this.towerMenu || this.towerMenu.position !== pos) {
                    // Si no hay menú o está en otra posición, mostrar nuevo menú
                    this.showTurretOptions(pos);
                }
                break;
            }
        }

        // Si el jugador no está en ningún spot y hay un menú abierto, cerrarlo
        if (!playerOnTowerSpot && this.towerMenu) {
            this.cleanupTowerMenu();
        }
    }

    private cleanupTowerMenu(): void {
        if (this.towerMenu) {
            this.towerMenu.bg.destroy();
            this.towerMenu.text.destroy();
            this.towerMenu.preview.destroy();
            this.towerMenu.cleanupListeners();
            this.towerMenu = undefined;
        }
    }

    private showTurretOptions(position: Phaser.Math.Vector2) {
        // Limpiar menú existente si lo hay
        this.cleanupTowerMenu();

        const existingTurret = this.turrets.find(t => 
            t.x === position.x && t.y === position.y
        );

        // Crear el menú en la esquina superior izquierda
        const menuBg = this.add.rectangle(120, 80, 240, 160, 0x000000, 0.8);
        let textContent = 'Selecciona nivel:\n';

        // Preview sprite
        let previewSprite;
        if (existingTurret) {
            const currentLevel = existingTurret.getLevel();
            const upgradeCost = existingTurret.getUpgradeCost();
            
            // Mostrar la torre actual
            previewSprite = this.add.sprite(120, 120, `tower-idle-${currentLevel}`);
            previewSprite.play(`tower-idle-${currentLevel}-anim`);
            
            if (currentLevel < 3) {
                const nextLevel = currentLevel + 1;
                textContent += `\nPresiona ${nextLevel} para mejorar\nCosto: $${upgradeCost}`;
                textContent += this.money >= upgradeCost ? '' : '\n(Sin dinero)';
            } else {
                textContent += '\nNivel máximo alcanzado';
            }
        } else {
            const options = [
                { level: 1, cost: 30 },
                { level: 2, cost: 60 },
                { level: 3, cost: 120 }
            ];

            options.forEach(({ level, cost }) => {
                const available = this.money >= cost;
                textContent += `\n${level}: $${cost}`;
                textContent += available ? '' : ' (Sin dinero)';
            });

            // Mostrar preview del nivel 1 por defecto
            previewSprite = this.add.sprite(120, 120, 'tower-idle-1');
            previewSprite.play('tower-idle-1-anim');
        }

        previewSprite.setScale(0.8);

        const text = this.add.text(20, 20, textContent, { 
            fontSize: '14px',
            color: '#ffffff',
            align: 'left'
        });

        let cleanupListeners = () => {
            this.input.keyboard?.removeListener('keydown-ONE');
            this.input.keyboard?.removeListener('keydown-TWO');
            this.input.keyboard?.removeListener('keydown-THREE');
        };

        // Solo agregar listeners si no hay torreta o si se puede mejorar
        if (!existingTurret) {
            // Listener para teclas de nueva torre
            this.input.keyboard?.on('keydown-ONE', () => {
                if (this.money >= 30) {
                    this.money -= 30;
                    const turret = new Turret(this, position.x, position.y, 1);
                    this.turrets.push(turret);
                    // Ocultar el spot de construcción
                    const spot = this.towerSpots.find(s => s.getData('position') === position);
                    if (spot) spot.setVisible(false);
                    this.updateUI();
                    this.showTurretOptions(position); // Actualizar menú
                }
            });

            this.input.keyboard?.on('keydown-TWO', () => {
                if (this.money >= 60) {
                    this.money -= 60;
                    const turret = new Turret(this, position.x, position.y, 2);
                    this.turrets.push(turret);
                    // Ocultar el spot de construcción
                    const spot = this.towerSpots.find(s => s.getData('position') === position);
                    if (spot) spot.setVisible(false);
                    this.updateUI();
                    this.showTurretOptions(position); // Actualizar menú
                }
            });

            this.input.keyboard?.on('keydown-THREE', () => {
                if (this.money >= 120) {
                    this.money -= 120;
                    const turret = new Turret(this, position.x, position.y, 3);
                    this.turrets.push(turret);
                    // Ocultar el spot de construcción
                    const spot = this.towerSpots.find(s => s.getData('position') === position);
                    if (spot) spot.setVisible(false);
                    this.updateUI();
                    this.showTurretOptions(position); // Actualizar menú
                }
            });
        } else {
            // Listener para mejora
            const nextLevel = existingTurret.getLevel() + 1;
            if (nextLevel <= 3) {
                // Usar los mismos códigos de tecla que para construir
                const keyMap: Record<number, string> = {
                    1: 'keydown-ONE',
                    2: 'keydown-TWO',
                    3: 'keydown-THREE'
                };
                
                const keyCode = keyMap[nextLevel];
                this.input.keyboard?.on(keyCode, () => {
                    console.log('Intento de mejora al nivel:', nextLevel); // Debug
                    const upgradeCost = existingTurret.getUpgradeCost();
                    if (this.money >= upgradeCost) {
                        this.money -= upgradeCost;
                        const success = existingTurret.upgrade();
                        if (success) {
                            console.log('Mejora exitosa al nivel:', nextLevel); // Debug
                            this.updateUI();
                            // Actualizar menú después de un breve delay para permitir la animación
                            this.time.delayedCall(500, () => {
                                this.showTurretOptions(position);
                            });
                        }
                    }
                });
                
                // Actualizar cleanupListeners para incluir la nueva tecla
                const originalCleanup = cleanupListeners;
                cleanupListeners = () => {
                    originalCleanup();
                    this.input.keyboard?.removeListener(keyCode);
                };
            }
        }

        this.towerMenu = {
            bg: menuBg,
            text: text,
            preview: previewSprite,
            position: position,
            cleanupListeners
        };
    }

    private startWave() {
        if (this.wave >= this.maxWaves || this.waveInProgress) return;

        this.waveInProgress = true;
        this.wave++;
        this.updateUI();

        // Create and start new wave
        this.currentWave = new Wave(this, this.enemyPath, this.waveConfigs[this.wave - 1]);        this.currentWave.start(() => {
            this.waveInProgress = false;
            this.updateUI();
            
            // Check if this was the last wave
            if (this.wave >= this.maxWaves) {
                // Game completed!
                this.time.delayedCall(1000, () => {
                    this.cleanupScene();
                    this.scene.start('GameOver');
                });
            }
        });
    }

    private updateUI() {
        // Actualizar el GUI en la escena
        this.gui.updateStats(this.lives, this.money, this.wave, this.maxWaves);

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

        // Resetear visibilidad de los spots de construcción
        this.towerSpots.forEach(spot => spot.setVisible(true));

        // Actualizar UI
        this.updateUI();
    }

    private handleWaveState(): void {
        const canStartNewWave = !this.currentWave || this.currentWave.isComplete();
        this.gui.showWavePrompt(canStartNewWave);
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

        this.handleWaveState();
    }
}
