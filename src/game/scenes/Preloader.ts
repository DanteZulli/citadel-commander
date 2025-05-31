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
        
        // Load goblin sprites
        // Walk animations
        this.load.spritesheet('goblin-walk-down', 'goblin/D_Walk.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('goblin-walk-side', 'goblin/S_Walk.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('goblin-walk-up', 'goblin/U_Walk.png', {
            frameWidth: 48,
            frameHeight: 48
        });

        // Death animations
        this.load.spritesheet('goblin-death-down', 'goblin/D_Death.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('goblin-death-side', 'goblin/S_Death.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('goblin-death-up', 'goblin/U_Death.png', {
            frameWidth: 48,
            frameHeight: 48
        });

        // Load slime sprites
        // Walk animations
        this.load.spritesheet('slime-walk-down', 'slime/D_Walk.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('slime-walk-side', 'slime/S_Walk.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('slime-walk-up', 'slime/U_Walk.png', {
            frameWidth: 48,
            frameHeight: 48
        });

        // Death animations
        this.load.spritesheet('slime-death-down', 'slime/D_Death.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('slime-death-side', 'slime/S_Death.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('slime-death-up', 'slime/U_Death.png', {
            frameWidth: 48,
            frameHeight: 48
        });
    }

    create ()
    {
        // Aquí podemos crear objetos globales que el resto del juego pueda usar
        // Por ejemplo, animaciones globales

        this.scene.start('MainMenu');
    }
}
