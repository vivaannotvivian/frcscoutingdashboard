import React, { useEffect, useState } from 'react';
import { useScout } from '../context/ScoutContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';

export default function SessionList({ onClose }) {
    const { loadSessions, joinSession, addTab } = useScout();
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions().then(data => {
            setSessions(data);
            setLoading(false);
        });
    }, []);

    const handleLoad = async (session) => {
        const success = await joinSession(session.id);
        if (success) {
            addTab('ALLIANCE', {}, session.name || 'Alliance Board');
            if (onClose) onClose();
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this session?')) return;

        const { error } = await supabase
            .from('alliance_sessions')
            .delete()
            .eq('id', id);

        if (!error) {
            setSessions(prev => prev.filter(s => s.id !== id));
        } else {
            alert('Failed to delete session');
        }
    };

    if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading sessions...</div>;

    const ownedSessions = sessions.filter(s => s.owner_id === user?.id);
    const sharedSessions = sessions.filter(s => s.owner_id !== user?.id);

    const renderSession = (session, isOwned) => (
        <div
            key={session.id}
            onClick={() => handleLoad(session)}
            style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
            <div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{session.name || 'Untitled'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Event: {session.event_code} • {new Date(session.created_at).toLocaleDateString()}
                </div>
            </div>
            {isOwned && (
                <button
                    onClick={(e) => handleDelete(e, session.id)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        fontSize: '1.2rem'
                    }}
                    title="Delete Session"
                >
                    &times;
                </button>
            )}
            {!isOwned && (
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontStyle: 'italic' }}>
                    Shared
                </div>
            )}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Owned Sessions */}
            <div>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>My Sessions</h3>
                {ownedSessions.length === 0 ? (
                    <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>No sessions created yet.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {ownedSessions.map(session => renderSession(session, true))}
                    </div>
                )}
            </div>

            {/* Shared Sessions */}
            {sharedSessions.length > 0 && (
                <div>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Shared with Me</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {sharedSessions.map(session => renderSession(session, false))}
                    </div>
                </div>
            )}
        </div>
    );
}
