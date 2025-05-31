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
        
        // Game Over text
        this.add.text(512, 384, 'Game Over', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#000000'
        }).setOrigin(0.5);
        
        window.dispatchEvent(new CustomEvent('gameSceneChange', { detail: 'GameOver' }));
        EventBus.emit('current-scene-ready', this);
    }
}
