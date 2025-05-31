import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        // Crear la barra de progreso
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload ()
    {
        this.load.setPath('assets');
        // Aquí cargaremos los assets del juego
    }

    create ()
    {
        // Aquí podemos crear objetos globales que el resto del juego pueda usar
        // Por ejemplo, animaciones globales

        this.scene.start('MainMenu');
    }
}
