import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getTeamStats, getEventTeamStats } from '../api/statbotics';
import { getTeamEventMatches, isTbaConfigured } from '../api/tba';
import { useScout } from '../context/ScoutContext';

export default function TeamDetails({ teamKey: propTeamKey }) {
    const params = useParams();
    const routerTeamKey = params.teamKey;
    const teamKey = propTeamKey || routerTeamKey;

    // Event Key Strategy: Prop? URL? Context?
    // Let's use URL param OR Global Context Event Code
    const [searchParams] = useSearchParams();
    const { eventCode } = useScout();
    const eventKey = searchParams.get('event') || eventCode;

    const [stats, setStats] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let teamStats = null;

                if (eventKey) {
                    try {
                        const eventStats = await getEventTeamStats(eventKey);
                        // teamKey from params is a string/number, Statbotics returns numbers
                        teamStats = eventStats.find(t => t.team == teamKey);
                    } catch (e) {
                        console.warn("Could not fetch event specific stats, falling back", e);
                    }
                }

                if (!teamStats) {
                    teamStats = await getTeamStats(teamKey);
                }

                setStats(teamStats);

                if (eventKey) {
                    const tbaTeamKey = `frc${teamKey}`;
                    const teamMatches = await getTeamEventMatches(tbaTeamKey, eventKey);
                    setMatches(teamMatches || []);
                }
            } catch (error) {
                console.error("Error loading team details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [teamKey, eventKey]);

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '1rem' }}>Team {teamKey}</h1>
            {eventKey && <h2 style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Event: {eventKey}</h2>}

            {!isTbaConfigured() && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                    <strong>Warning:</strong> The Blue Alliance API Key is missing. Match videos will not load.
                </div>
            )}

            {stats && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3>Statbotics Overview</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total EPA</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.epa_total?.toFixed(1) || '-'}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Auto EPA</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.epa_auto?.toFixed(1) || '-'}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Teleop EPA</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.epa_teleop?.toFixed(1) || '-'}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Endgame EPA</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.epa_endgame?.toFixed(1) || '-'}</div>
                        </div>
                    </div>
                </div>
            )}

            <h2 style={{ marginBottom: '1.5rem' }}>Match Videos</h2>
            {matches.length === 0 ? (
                <p>No matches found or videos available.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {matches
                        .filter(m => m.videos && m.videos.length > 0)
                        .map(match => (
                            <div key={match.key} className="glass-panel" style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                                    Match {match.match_number} ({match.comp_level})
                                </div>
                                <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                                    <iframe
                                        src={`https://www.youtube.com/embed/${match.videos[0].key}`}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                        allowFullScreen
                                        title={`Match ${match.match_number}`}
                                    />
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
