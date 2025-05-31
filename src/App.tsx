import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    return (
        <div id="app" style={{ 
            display: 'flex', 
            height: '90vh',
            paddingTop: '1rem',
            paddingBottom: '1rem',
            backgroundColor: '#000'
        }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <PhaserGame ref={phaserRef} />
            </div>
        </div>
    );
}

export default App;
