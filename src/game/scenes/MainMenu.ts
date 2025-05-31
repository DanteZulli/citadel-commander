import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.add.text(512, 384, 'Menú Principal', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5);
        
        EventBus.emit('current-scene-ready', this);
    }
    
    changeScene ()
    {
        this.scene.start('Game');
    }
}
