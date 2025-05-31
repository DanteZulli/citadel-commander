import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    return (
        <div id="app" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
        }}>
            <PhaserGame ref={phaserRef} />
        </div>
    )
}

export default App
