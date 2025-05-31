import { Scene } from 'phaser';

export class GUI extends Phaser.GameObjects.Container {
    private livesText: Phaser.GameObjects.Text;
    private moneyText: Phaser.GameObjects.Text;
    private waveText: Phaser.GameObjects.Text;
    private livesIcon: Phaser.GameObjects.Sprite;
    private moneyIcon: Phaser.GameObjects.Sprite;
    private waveIcon: Phaser.GameObjects.Sprite;
    private wavePromptText: Phaser.GameObjects.Text;
    private blinkEffect?: Phaser.Tweens.Tween;

    constructor(scene: Scene) {
        super(scene);        // Posición base para el primer elemento
        const startX = scene.cameras.main.width - 160; // Más espacio para el texto pixel
        const startY = 20;
        const spacing = 45; // Más espacio vertical para la fuente pixel

        // Iconos (usando los sprites del GUI)
        this.livesIcon = scene.add.sprite(startX - 35, startY, 'gui-heart', 0);
        this.moneyIcon = scene.add.sprite(startX - 30, startY + spacing, 'gui-coin', 0);
        this.waveIcon = scene.add.sprite(startX - 30, startY + spacing * 2, 'gui-waves', 0);

        // Ajustar el tamaño de los iconos (3x más grandes)
        [this.livesIcon, this.moneyIcon].forEach(icon => {
            icon.setScale(2);
        });
        this.waveIcon.setScale(2);        // Textos
        const textStyle = {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: '"Press Start 2P"'
        };

        this.livesText = scene.add.text(startX, startY, '20', textStyle);
        this.moneyText = scene.add.text(startX, startY + spacing, '100', textStyle);
        this.waveText = scene.add.text(startX, startY + spacing * 2, '0/3', textStyle);

        // Centrar verticalmente los textos con sus iconos
        [this.livesText, this.moneyText, this.waveText].forEach(text => {
            text.setOrigin(0, 0.5);
        });

        // Wave prompt text
        const promptTextStyle = {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: '"Press Start 2P"',
            align: 'center'
        };

        this.wavePromptText = scene.add.text(
            scene.cameras.main.width / 2,
            scene.cameras.main.height - 50,
            'Press \'ENTER\' to start a new wave',
            promptTextStyle
        );
        this.wavePromptText.setOrigin(0.5);
        this.wavePromptText.setVisible(false);
        this.add(this.wavePromptText);

        // Añadir todos los elementos al contenedor
        this.add([
            this.livesIcon,
            this.moneyIcon,
            this.waveIcon,
            this.livesText,
            this.moneyText,
            this.waveText,
            this.wavePromptText
        ]);

        // Añadir el contenedor a la escena
        scene.add.existing(this);
    }

    public showWavePrompt(show: boolean): void {
        this.wavePromptText.setVisible(show);
        
        if (show && (!this.blinkEffect || !this.blinkEffect.isPlaying())) {
            this.blinkEffect = this.scene.tweens.add({
                targets: this.wavePromptText,
                alpha: 0,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Linear'
            });
        } else if (!show && this.blinkEffect) {
            this.blinkEffect.stop();
            this.wavePromptText.setAlpha(1);
        }
    }

    public updateStats(lives: number, money: number, wave: number, maxWaves: number): void {
        this.livesText.setText(lives.toString());
        this.moneyText.setText(money.toString());
        this.waveText.setText(`${wave}/${maxWaves}`);
    }
}
