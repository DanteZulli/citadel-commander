import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        // Aquí cargaremos los assets necesarios para el Preloader
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
