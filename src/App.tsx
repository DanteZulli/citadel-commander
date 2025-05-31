import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { MainMenu } from './game/scenes/MainMenu';

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const changeScene = () => {
        if(phaserRef.current) {     
            const scene = phaserRef.current.scene as MainMenu;
            if (scene) {
                scene.changeScene();
            }
        }
    }

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
            <div>
                <button className="button" onClick={changeScene}>Change Scene</button>
            </div>
        </div>
    )
}

export default App
