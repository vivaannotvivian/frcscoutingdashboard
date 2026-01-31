import React, { useState } from 'react';
import { useScout } from '../context/ScoutContext';
import SessionList from '../components/SessionList';

export default function SessionSelector({ onSessionSelected, onGoBack }) {
    const { createSession } = useScout();
    const [sessionName, setSessionName] = useState('New Session');
    const [view, setView] = useState('menu'); // 'menu', 'new', 'load'

    const handleCreateNew = async () => {
        const id = await createSession(sessionName);
        if (id && onSessionSelected) {
            onSessionSelected();
        }
    };

    if (view === 'load') {
        return (
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <button
                        className="btn"
                        style={{ background: 'var(--bg-secondary)' }}
                        onClick={() => setView('menu')}
                    >
                        ← Back
                    </button>
                </div>
                <SessionList onClose={onSessionSelected} />
            </div>
        );
    }

    if (view === 'new') {
        return (
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Create New Session</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        className="input-field"
                        placeholder="Session Name"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        style={{ padding: '0.75rem' }}
                        autoFocus
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn"
                            style={{ flex: 1, background: 'var(--bg-secondary)' }}
                            onClick={() => setView('menu')}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1, background: 'var(--accent-primary)' }}
                            onClick={handleCreateNew}
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Menu view
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '4rem 2rem' }}>
            {onGoBack && (
                <div style={{ alignSelf: 'flex-start', width: '100%', maxWidth: '400px' }}>
                    <button
                        className="btn"
                        style={{ background: 'var(--accent-primary)' }}
                        onClick={onGoBack}
                    >
                        ← Back to Menu
                    </button>
                </div>
            )}
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Alliance Selection</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Choose an option to get started</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
                <button
                    className="glass-panel"
                    onClick={() => setView('new')}
                    style={{
                        padding: '1.5rem',
                        cursor: 'pointer',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        ✨ Create New Session
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Start a fresh alliance selection board
                    </div>
                </button>

                <button
                    className="glass-panel"
                    onClick={() => setView('load')}
                    style={{
                        padding: '1.5rem',
                        cursor: 'pointer',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        📂 Load Session
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Open a previous or shared session
                    </div>
                </button>
            </div>
        </div>
    );
}
