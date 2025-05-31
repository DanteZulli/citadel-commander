import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000000);        // Título del juego
        this.add.text(400, 200, 'CITADEL COMMANDER', {
            fontFamily: '"Press Start 2P"',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Botón de jugar
        const gameText = this.add.text(400, 384, 'PLAY', {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive();
        
        gameText.on('pointerover', () => {
            gameText.setTint(0x999999);
        });
        
        gameText.on('pointerout', () => {
            gameText.clearTint();
        });
        
        gameText.on('pointerdown', () => {
            this.startGame();
        });

        EventBus.emit('current-scene-ready', this);
    }

    startGame() {
        this.scene.start('Game');
    }
}
