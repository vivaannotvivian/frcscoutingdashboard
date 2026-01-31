import { useState, useEffect } from 'react';
import { getEventTeamStats } from '../api/statbotics';
import { useScout } from '../context/ScoutContext';
import { useAuth } from '../context/AuthContext';
import TeamContextMenu from '../components/TeamContextMenu';

export default function Home() {
    const { eventCode, setEventCode, addTeamToTier, addTab } = useScout();
    const [localEventCode, setLocalEventCode] = useState(eventCode);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user, username } = useAuth();
    const [sortConfig, setSortConfig] = useState({ key: 'epa_total', direction: 'desc' });

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null);

    useEffect(() => {
        setLocalEventCode(eventCode);
        if (eventCode && !data) {
            handleSearch(null, eventCode);
        }
    }, [eventCode]);

    const handleSearch = async (e, codeOverride = null) => {
        if (e) e.preventDefault();
        const code = codeOverride || localEventCode;
        if (!code) return;

        setLoading(true);
        setError(null);
        setData(null);

        // Update global context
        setEventCode(code);

        try {
            const stats = await getEventTeamStats(code);
            if (!stats || stats.length === 0) {
                setError('No data found for this event code.');
            } else {
                console.log('Statbotics Data:', stats);
                setData(stats);
            }
        } catch (err) {
            setError('Failed to fetch event data. Please check the event code.');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const handleContextMenu = (e, team) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, team });
    };

    const handleAddToTier = (tierId) => {
        if (contextMenu?.team) {
            addTeamToTier(contextMenu.team, tierId);
            setContextMenu(null);
        }
    };

    const handleOpenTeam = (e, team) => {
        e.stopPropagation();
        addTab('TEAM', { team: team.team }, `Team ${team.team}`);
    };

    const sortedData = data ? [...data].sort((a, b) => {
        const aValue = a[sortConfig.key] || 0;
        const bValue = b[sortConfig.key] || 0;

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    }) : null;

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>FRC Event Scout</h1>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Welcome, {username}</div>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Enter Event Code (e.g., 2024tur)"
                        value={localEventCode}
                        onChange={(e) => setLocalEventCode(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
                {error && <p style={{ color: 'var(--danger)', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}
            </div>

            {sortedData && (
                <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('team')}>Team</th>
                                <th style={{ padding: '1rem', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('epa_total')}>Total EPA</th>
                                <th style={{ padding: '1rem', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('epa_auto')}>Auto EPA</th>
                                <th style={{ padding: '1rem', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('epa_teleop')}>Teleop EPA</th>
                                <th style={{ padding: '1rem', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('epa_endgame')}>Endgame EPA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((team) => (
                                <tr key={team.team} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'context-menu' }}
                                    onContextMenu={(e) => handleContextMenu(e, team)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '1rem' }}>
                                        <span
                                            onClick={(e) => handleOpenTeam(e, team)}
                                            style={{ fontWeight: 'bold', cursor: 'pointer', color: 'var(--accent-primary)', textDecoration: 'underline' }}
                                        >
                                            {team.team}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                        {team.epa_total?.toFixed(1) || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>{team.epa_auto?.toFixed(1) || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>{team.epa_teleop?.toFixed(1) || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>{team.epa_endgame?.toFixed(1) || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Right-click any team to add to Alliance Selection tiers. Click Team # to open in new tab.
                    </p>
                </div>
            )}

            {contextMenu && (
                <TeamContextMenu
                    team={contextMenu.team}
                    position={{ x: contextMenu.x, y: contextMenu.y }}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
}
