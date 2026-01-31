import React, { useState, useEffect } from 'react';
import { useScout } from '../context/ScoutContext';

export default function ShareModal({ onClose }) {
    const { shareSession, getSharedUsers, sessionKey } = useScout();
    const [email, setEmail] = useState('');
    const [sharedUsers, setSharedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        loadSharedUsers();
    }, [sessionKey]);

    const loadSharedUsers = async () => {
        const users = await getSharedUsers();
        setSharedUsers(users);
    };

    const handleShare = async (e) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        setMsg(null);
        try {
            await shareSession(email);
            setMsg({ type: 'success', text: `Shared with ${email}` });
            setEmail('');
            loadSharedUsers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to share. User might already have access or does not exist.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px', pointerEvents: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Share Session</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                </div>

                <form onSubmit={handleShare} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <input
                        className="input-field"
                        placeholder="Enter email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        type="email"
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? '...' : 'Share'}
                    </button>
                </form>

                {msg && (
                    <div style={{
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        marginBottom: '1rem',
                        background: msg.type === 'success' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                        color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)',
                        fontSize: '0.9rem'
                    }}>
                        {msg.text}
                    </div>
                )}

                <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Shared With:</h3>
                    {sharedUsers.length === 0 ? (
                        <div style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No other users</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {sharedUsers.map(u => (
                                <div key={u} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.25rem', fontSize: '0.9rem' }}>
                                    {u}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
