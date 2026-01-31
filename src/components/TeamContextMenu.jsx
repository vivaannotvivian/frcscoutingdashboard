import { useEffect, useRef } from 'react';
import { useScout } from '../context/ScoutContext';

export default function TeamContextMenu({ team, position, onClose }) {
    const { addTeamToTier, eventCode } = useScout();
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        // Delay adding listener to avoid immediate close from the click that opened it
        const timer = setTimeout(() => {
            document.addEventListener('click', handleClick);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClick);
        };
    }, [onClose]);

    const handleAddToTier = (tierId) => {
        // team might be an object or just a number/string depending on where we click
        // We normalize it to object for addTeamToTier
        const teamObj = typeof team === 'object' ? team : { team: team };
        // If it's just a number, we don't have EPA stats immediately available if clicked from somewhere without data context
        // But usually we pass the full team object. 
        // If not, addTeamToTier logic might need to handle fetching or just add placeholder.
        // For now assuming team object is passed.

        addTeamToTier(teamObj, tierId);
        onClose();
    };

    const handleOpenStats = () => {
        const teamNum = typeof team === 'object' ? team.team : team;
        const url = `/team/${teamNum}${eventCode ? `?event=${eventCode}` : ''}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        onClose();
    };

    const teamName = typeof team === 'object' ? team.team : team;

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: position.y,
                left: position.x,
                zIndex: 1000,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--accent-primary)',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                minWidth: '160px'
            }}
        >
            <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Team {teamName}
            </div>

            <div
                onClick={handleOpenStats}
                style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '0.25rem', display: 'flex', alignItems: 'center' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                Open Stats ↗
            </div>

            <div style={{ margin: '0.5rem 0', height: '1px', background: 'var(--glass-border)' }} />

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '0.5rem', marginBottom: '0.25rem' }}>
                Add to Tier:
            </div>

            {['S', 'A', 'B', 'C', 'DNP'].map(tier => (
                <div
                    key={tier}
                    onClick={() => handleAddToTier(tier)}
                    style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '0.25rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    Tier {tier}
                </div>
            ))}
        </div>
    );
}
