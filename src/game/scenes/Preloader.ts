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
        
        // Load player sprites
        // Fly animations (idle/movement)
        this.load.spritesheet('player-fly-down', 'player/D_Fly.png', {
            frameWidth: 96,
            frameHeight: 96
        });
        this.load.spritesheet('player-fly-side', 'player/S_Fly.png', {
            frameWidth: 96,
            frameHeight: 96
        });
        this.load.spritesheet('player-fly-up', 'player/U_Fly.png', {
            frameWidth: 96,
            frameHeight: 96
        });

        // Attack animations
        this.load.spritesheet('player-attack-down', 'player/D_Attack.png', {
            frameWidth: 96,
            frameHeight: 96
        });
        this.load.spritesheet('player-attack-side', 'player/S_Attack.png', {
            frameWidth: 96,
            frameHeight: 96
        });
        this.load.spritesheet('player-attack-up', 'player/U_Attack.png', {
            frameWidth: 96,
            frameHeight: 96
        });

        // Death animations
        this.load.spritesheet('player-death-down', 'player/D_Death.png', {
            frameWidth: 96,
            frameHeight: 96
        });
        this.load.spritesheet('player-death-side', 'player/S_Death.png', {
            frameWidth: 96,
            frameHeight: 96
        });
        this.load.spritesheet('player-death-up', 'player/U_Death.png', {
            frameWidth: 96,
            frameHeight: 96
        });

        // Projectiles
        this.load.image('player-projectile-1', 'player/Projectile1.png');
        this.load.image('player-projectile-2', 'player/Projectile2.png');

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

        // Load wolf sprites
        // Walk animations
        this.load.spritesheet('wolf-walk-down', 'wolf/D_Walk.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('wolf-walk-side', 'wolf/S_Walk.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('wolf-walk-up', 'wolf/U_Walk.png', {
            frameWidth: 48,
            frameHeight: 48
        });

        // Death animations
        this.load.spritesheet('wolf-death-down', 'wolf/D_Death.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('wolf-death-side', 'wolf/S_Death.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('wolf-death-up', 'wolf/U_Death.png', {
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
