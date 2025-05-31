import React from 'react';

interface GameStats {
    lives: number;
    money: number;
    wave: number;
    maxWaves: number;
    waveInProgress: boolean;
}

interface SidebarProps {
    gameStats: GameStats;
    onStartWave: () => void;
    onReturnToMenu: () => void;
    onRetry: () => void;
    isGameOver: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    gameStats, 
    onStartWave, 
    onReturnToMenu, 
    onRetry, 
    isGameOver 
}) => {
    return (
        <div style={{
            width: '200px',
            backgroundColor: '#222',
            padding: '20px',
            color: '#fff',
            fontFamily: 'Arial'
        }}>
            <h2 style={{ textAlign: 'center', margin: '0 0 20px 0' }}>MENU</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <div>Lives: {gameStats.lives}</div>
                <div>Money: {gameStats.money}</div>
                <div>Wave: {gameStats.wave}/{gameStats.maxWaves}</div>
            </div>

            {!isGameOver && (
                <button 
                    onClick={onStartWave}
                    disabled={gameStats.waveInProgress || gameStats.wave >= gameStats.maxWaves}
                    style={{
                        width: '100%',
                        padding: '10px',
                        marginBottom: '10px',
                        backgroundColor: gameStats.waveInProgress ? '#666' : '#333',
                        color: '#fff',
                        border: 'none',
                        cursor: gameStats.waveInProgress ? 'not-allowed' : 'pointer'
                    }}
                >
                    Start Wave
                </button>
            )}

            {isGameOver && (
                <button 
                    onClick={onRetry}
                    style={{
                        width: '100%',
                        padding: '10px',
                        marginBottom: '10px',
                        backgroundColor: '#333',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Retry
                </button>
            )}

            <button 
                onClick={onReturnToMenu}
                style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer'
                }}
            >
                Main Menu
            </button>
        </div>
    );
};
