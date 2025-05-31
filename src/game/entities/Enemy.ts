import { Scene } from 'phaser';

export class Enemy extends Phaser.GameObjects.Container {
    private health: number = 1;
    private speed: number = 100;
    private path: Phaser.Math.Vector2[];
    private currentPathIndex: number = 0;
    private visual: Phaser.GameObjects.Rectangle;
    private currentTween?: Phaser.Tweens.Tween;
    
    constructor(scene: Scene, path: Phaser.Math.Vector2[]) {
        super(scene, path[0].x, path[0].y);
        
        this.path = path;
        
        // Crear representación visual simple del enemigo
        this.visual = scene.add.rectangle(0, 0, 20, 20, 0xffffff);
        this.add(this.visual);
        
        scene.add.existing(this);
        this.moveToNextPoint();
    }    public damage(amount: number): void {
        this.health -= amount;
        if (this.health <= 0) {
            // Asegurarnos de que la escena exista antes de emitir el evento
            if (this.scene) {
                this.scene.events.emit('enemyKilled', this);
            }

            // Detener el movimiento actual antes de destruir
            if (this.currentTween) {
                this.currentTween.stop();
                this.currentTween = undefined;
            }
            
            this.destroy();
        }
    }
    
    private moveToNextPoint(): void {
        // Si el enemigo ya fue destruido, no continuar
        if (!this.scene || !this.active) return;

        if (this.currentPathIndex >= this.path.length - 1) {
            // El enemigo llegó al final del camino
            this.scene.events.emit('enemyReachedEnd', this);
            this.destroy();
            return;
        }
        
        const nextPoint = this.path[this.currentPathIndex + 1];
        const distance = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            nextPoint.x,
            nextPoint.y
        );
        
        this.currentTween = this.scene.tweens.add({
            targets: this,
            x: nextPoint.x,
            y: nextPoint.y,
            duration: (distance / this.speed) * 1000,
            onComplete: () => {
                // Verificar si el enemigo aún existe antes de continuar
                if (this.scene && this.active) {
                    this.currentPathIndex++;
                    this.moveToNextPoint();
                }
            }
        });
    }
}
