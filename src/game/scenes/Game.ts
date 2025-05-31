import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { Turret } from '../entities/Turret';
import { Enemy } from '../entities/Enemy';

export class Game extends Scene {
    private lives: number = 20;
    private money: number = 100;
    private camera: Phaser.Cameras.Scene2D.Camera;    private wave: number = 0;
    private maxWaves: number = 3;
    private enemies: Enemy[] = [];
    private turrets: Turret[] = [];
    private towerPositions: Phaser.Math.Vector2[] = [];
    private enemyPath: Phaser.Math.Vector2[] = [];
    private livesText: Phaser.GameObjects.Text;
    private moneyText: Phaser.GameObjects.Text;
    private waveText: Phaser.GameObjects.Text;
    private waveInProgress: boolean = false;
    private startWaveButton: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x000000);

        this.setupPath();
        this.setupTowerPositions();
        this.createUI();
          // Event handler para cuando un enemigo llega al final
        this.events.on('enemyReachedEnd', (enemy: Enemy) => {
            this.lives--;
            this.updateUI();
            
            if (this.lives <= 0) {
                this.scene.start('GameOver');
            }
        });

        // Event handler para cuando un enemigo es eliminado
        this.events.on('enemyKilled', (enemy: Enemy) => {
            this.money += 15; // Recompensa de 15 por matar un enemigo
            this.updateUI();
        });

        EventBus.emit('current-scene-ready', this);
    }    private createUI() {
        // Fondo del menú lateral
        const menuBg = this.add.rectangle(924, 0, 200, 768, 0x222222)
            .setOrigin(0, 0);

        // UI básica (stats)
        this.livesText = this.add.text(20, 20, `Lives: ${this.lives}`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        });

        this.moneyText = this.add.text(20, 50, `Money: ${this.money}`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        });

        this.waveText = this.add.text(20, 80, `Wave: ${this.wave}/${this.maxWaves}`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        });

        // Menú lateral
        const menuTitle = this.add.text(1024, 30, 'MENU', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);        // Botón para iniciar la oleada
        this.startWaveButton = this.add.text(1024, 100, 'Start Wave', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 15, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive()        .on('pointerover', () => {
            if (!this.waveInProgress) {
                this.startWaveButton.setTint(0x999999);
            }
        })
        .on('pointerout', function(this: Phaser.GameObjects.Text) {
            this.clearTint();
        })
        .on('pointerdown', () => {
            if (!this.waveInProgress) {
                this.startWave();
            }
        });

        // Botón para volver al menú
        this.add.text(1024, 160, 'Main Menu', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 15, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerover', function(this: Phaser.GameObjects.Text) {
            this.setTint(0x999999);
        })
        .on('pointerout', function(this: Phaser.GameObjects.Text) {
            this.clearTint();
        })
        .on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
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
    }

    private setupTowerPositions() {
        // Definir posiciones posibles para las torres
        this.towerPositions = [
            new Phaser.Math.Vector2(250, 200),
            new Phaser.Math.Vector2(350, 200),
            new Phaser.Math.Vector2(250, 400),
            new Phaser.Math.Vector2(350, 400)
        ];

        // Mostrar las posiciones disponibles
        this.towerPositions.forEach(pos => {
            const point = this.add.circle(pos.x, pos.y, 15, 0x333333)
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
    }    private startWave() {
        if (this.wave >= this.maxWaves || this.waveInProgress) return;
        
        this.waveInProgress = true;
        this.wave++;
        const enemyCount = 5 + (this.wave * 2); // Aumenta la cantidad de enemigos por oleada
        
        // Actualizar visualmente el botón
        this.startWaveButton.setColor('#666666');
        
        // Spawner de enemigos
        let spawned = 0;
        const spawnInterval = this.time.addEvent({
            delay: 1000,
            callback: () => {
                const enemy = new Enemy(this, this.enemyPath);
                this.enemies.push(enemy);
                spawned++;
                
                if (spawned >= enemyCount) {
                    spawnInterval.destroy();
                    
                    // Configurar un temporizador para verificar cuando todos los enemigos han sido eliminados
                    this.time.addEvent({
                        delay: 100,
                        callback: () => {
                            if (this.enemies.length === 0) {
                                this.waveInProgress = false;
                                this.startWaveButton.setColor('#ffffff');
                            }
                        },
                        loop: true
                    });
                }
            },
            repeat: enemyCount - 1
        });

        this.updateUI();
    }

    private updateUI() {
        this.livesText.setText(`Lives: ${this.lives}`);
        this.moneyText.setText(`Money: ${this.money}`);
        this.waveText.setText(`Wave: ${this.wave}/${this.maxWaves}`);
    }

    update(time: number) {
        // Actualizar las torretas
        this.turrets.forEach(turret => {
            turret.update(time, this.enemies);
        });

        // Limpiar enemigos destruidos
        this.enemies = this.enemies.filter(enemy => enemy.active);
    }
}
