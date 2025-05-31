import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0xffffff);
        
        this.add.text(512, 384, 'Escena del Juego', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5);
        
        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
