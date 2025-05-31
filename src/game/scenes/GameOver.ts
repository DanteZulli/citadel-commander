import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;

    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0xffffff);
        
        this.add.text(512, 384, 'Game Over', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5);
        
        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}
