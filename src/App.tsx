import { useRef, useState, useEffect } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { Sidebar } from './components/Sidebar';

interface GameStats {
    lives: number;
    money: number;
    wave: number;
    maxWaves: number;
    waveInProgress: boolean;
}

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStats, setGameStats] = useState<GameStats>({
        lives: 20,
        money: 100,
        wave: 0,
        maxWaves: 3,
        waveInProgress: false
    });

    useEffect(() => {
        const handleSceneChange = (e: CustomEvent<string>) => {
            const sceneName = e.detail;
            setShowSidebar(sceneName === 'Game' || sceneName === 'GameOver');
            setIsGameOver(sceneName === 'GameOver');
        };

        const handleStatsUpdate = (e: CustomEvent<GameStats>) => {
            setGameStats(e.detail);
        };

        // Subscribe to events
        window.addEventListener('gameSceneChange', handleSceneChange as EventListener);
        window.addEventListener('gameStatsUpdate', handleStatsUpdate as EventListener);

        return () => {
            window.removeEventListener('gameSceneChange', handleSceneChange as EventListener);
            window.removeEventListener('gameStatsUpdate', handleStatsUpdate as EventListener);
        };
    }, []);

    const startWave = () => {
        if (phaserRef.current) {
            phaserRef.current.game?.events.emit('startWave');
        }
    };

    const returnToMenu = () => {
        if (phaserRef.current) {
            phaserRef.current.game?.events.emit('returnToMenu');
        }
    };

    const retry = () => {
        if (phaserRef.current) {
            phaserRef.current.game?.events.emit('retry');
        }
    };

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
            
            {showSidebar && (
                <Sidebar
                    gameStats={gameStats}
                    onStartWave={startWave}
                    onReturnToMenu={returnToMenu}
                    onRetry={retry}
                    isGameOver={isGameOver}
                />
            )}
        </div>
    );
}

export default App;
