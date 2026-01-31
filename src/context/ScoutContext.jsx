import { createContext, useContext, useState, useEffect, useRef } from 'react';
import supabase from '../supabaseClient';
import { useAuth } from './AuthContext';

const ScoutContext = createContext();

const DEFAULT_TIERS = {
    S: { id: 'S', name: 'S Tier', description: 'Top picks', color: 'var(--accent-secondary)', items: [] },
    A: { id: 'A', name: 'A Tier', description: 'Strong contenders', color: 'var(--success)', items: [] },
    B: { id: 'B', name: 'B Tier', description: 'Solid picks', color: 'var(--accent-primary)', items: [] },
    C: { id: 'C', name: 'C Tier', description: 'Backups', color: 'var(--warning)', items: [] },
    DNP: { id: 'DNP', name: 'DNP', description: 'Do Not Pick', color: 'var(--danger)', items: [] },
    POOL: { id: 'POOL', name: 'Pool', description: 'All Teams', color: 'var(--bg-secondary)', items: [] },
};

export function ScoutProvider({ children }) {
    const { user } = useAuth();
    // --- Global Persistence ---
    const [eventCode, setEventCode] = useState(() => localStorage.getItem('frc_event_code') || '');
    const [allianceData, setAllianceData] = useState(() => {
        const saved = localStorage.getItem('frc_alliance_data');
        return saved ? JSON.parse(saved) : DEFAULT_TIERS;
    });

    // --- Tab Management ---
    const [tabs, setTabs] = useState([
        { id: '1', type: 'HOME', title: 'Event Search', data: {} },
        { id: '2', type: 'ALLIANCE', title: 'Alliance Board', data: {} }
    ]);
    const [activeTabId, setActiveTabId] = useState('1');

    const addTab = (type, data = {}, title = 'New Tab') => {
        // If a tab with this type/data already exists, just activate it?
        // For Teams, we unique by team number
        if (type === 'TEAM') {
            const existing = tabs.find(t => t.type === 'TEAM' && t.data?.team === data.team);
            if (existing) {
                setActiveTabId(existing.id);
                return;
            }
            title = `Team ${data.team}`;
        }

        const newId = Date.now().toString();
        console.log('Adding new tab:', { id: newId, type, title, data });
        setTabs(prev => [...prev, { id: newId, type, title, data }]);
        setActiveTabId(newId);
    };

    const closeTab = (id) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== id);
            if (activeTabId === id && newTabs.length > 0) {
                setActiveTabId(newTabs[newTabs.length - 1].id);
            }
            return newTabs;
        });
    };

    const reorderTabs = (newTabs) => setTabs(newTabs);

    // --- Supabase Realtime ---
    const [sessionKey, setSessionKey] = useState(null);
    const [sessionName, setSessionName] = useState('Untitled Session');
    const [sessionOwner, setSessionOwner] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef(null);
    const isRemoteUpdate = useRef(false);

    // Drag Tracking
    const [remoteDragState, setRemoteDragState] = useState({}); // { teamId: true/false }
    const channelRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('frc_event_code', eventCode);
    }, [eventCode]);

    // Listen for storage changes (Multi-window sync)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'frc_alliance_data' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (parsed && typeof parsed === 'object') {
                        // Validate and sanitize items
                        const sanitized = { ...parsed };
                        Object.keys(sanitized).forEach(key => {
                            if (sanitized[key] && Array.isArray(sanitized[key].items)) {
                                sanitized[key].items = sanitized[key].items.filter(i => i && i.id);
                            }
                        });
                        setAllianceData(prev => ({ ...prev, ...sanitized }));
                    }
                } catch (err) {
                    console.error("Failed to parse storage update", err);
                }
            }
            if (e.key === 'frc_event_code' && e.newValue) {
                setEventCode(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        // Local persistence
        localStorage.setItem('frc_alliance_data', JSON.stringify(allianceData));

        // Supabase Sync (Debounced)
        if (isOnline && sessionKey && supabase) {
            if (isRemoteUpdate.current) {
                isRemoteUpdate.current = false;
                return; // Don't write back what we just received
            }

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            saveTimeoutRef.current = setTimeout(() => {
                updateSupabase(sessionKey, allianceData);
            }, 1000); // 1 second debounce
        }
    }, [allianceData, isOnline, sessionKey]);

    const updateSupabase = async (key, data, name) => {
        setIsSaving(true);
        const updatePayload = { data: data };
        if (name) updatePayload.name = name;

        const { error } = await supabase
            .from('alliance_sessions')
            .update(updatePayload)
            .eq('id', key);

        setIsSaving(false);
        if (error) console.error("Supabase sync error:", error);
    };

    // Explicit Save
    const saveSession = async () => {
        if (!sessionKey) return;
        await updateSupabase(sessionKey, allianceData, sessionName);
    };

    useEffect(() => {
        // Local persistence
        localStorage.setItem('frc_alliance_data', JSON.stringify(allianceData));

        // Supabase Sync (Debounced)
        if (isOnline && sessionKey && supabase) {
            if (isRemoteUpdate.current) {
                isRemoteUpdate.current = false;
                return; // Don't write back what we just received
            }

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            saveTimeoutRef.current = setTimeout(() => {
                updateSupabase(sessionKey, allianceData);
            }, 1000); // 1 second debounce
        }
    }, [allianceData, isOnline, sessionKey]);

    // Handle Name changes separately to avoid massive write loops? 
    // Actually, name change should also trigger save.
    useEffect(() => {
        if (isOnline && sessionKey && supabase) {
            updateSupabase(sessionKey, allianceData, sessionName); // Save name immediately/debounced
        }
    }, [sessionName]);

    const createSession = async (name = 'Untitled Session') => {
        if (!supabase || !user) return null;
        const id = Math.random().toString(36).substring(2, 9);
        const { error } = await supabase
            .from('alliance_sessions')
            .insert([{
                id,
                event_code: eventCode,
                data: allianceData,
                owner_id: user.id,
                name: name
            }]);

        if (error) {
            console.error(error);
            return null;
        }
        setSessionName(name);
        setSessionOwner(user.id); // I am the owner
        joinSession(id); // Auto join
        return id;
    };

    const shareSession = async (targetEmail) => {
        if (!sessionKey || !targetEmail) return false;

        const { error } = await supabase
            .from('alliance_shares')
            .insert([{ session_id: sessionKey, user_email: targetEmail }]);

        if (error) {
            console.error("Share error:", error);
            throw error;
        }
        return true;
    };

    const getSharedUsers = async () => {
        if (!sessionKey) return [];
        const { data, error } = await supabase
            .from('alliance_shares')
            .select('user_email')
            .eq('session_id', sessionKey);

        if (error) return [];
        return data.map(d => d.user_email);
    };

    const loadSessions = async () => {
        if (!supabase || !user) return [];
        const { data, error } = await supabase
            .from('alliance_sessions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            return [];
        }
        return data; // RLS will filter this to owned or shared
    };

    const joinSession = async (id) => {
        if (!supabase) return false;

        // Clean up previous channel
        if (channelRef.current) supabase.removeChannel(channelRef.current);

        const { data, error } = await supabase
            .from('alliance_sessions')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error(error);
            return false;
        }

        // Initial Load
        isRemoteUpdate.current = true; // Prevent immediate echo
        setAllianceData(data.data);
        setEventCode(data.event_code);
        setSessionName(data.name || 'Untitled Session');
        setSessionOwner(data.owner_id);
        setSessionKey(id);
        setIsOnline(true);

        // Subscribe to DB Changes AND Broadcasts
        const channel = supabase.channel(`room:${id}`);
        channelRef.current = channel;

        channel
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'alliance_sessions', filter: `id=eq.${id}` }, payload => {
                if (payload.new && payload.new.data) {
                    setAllianceData(prev => {
                        const currentStr = JSON.stringify(prev);
                        const newStr = JSON.stringify(payload.new.data);
                        if (currentStr !== newStr) {
                            isRemoteUpdate.current = true;
                            return payload.new.data;
                        }
                        return prev;
                    });
                }
            })
            .on('broadcast', { event: 'drag' }, (payload) => {
                // payload.payload = { teamId, isDragging }
                setRemoteDragState(prev => ({
                    ...prev,
                    [payload.payload.teamId]: payload.payload.isDragging
                }));
            })
            .subscribe();

        return true;
    };

    const leaveSession = () => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        setIsOnline(false);
        setSessionKey(null);
        setSessionOwner(null);
        setRemoteDragState({});
    };

    const broadcastDrag = (teamId, isDragging) => {
        if (channelRef.current && isOnline) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'drag',
                payload: { teamId, isDragging }
            });
        }
    };

    // --- Modifiers ---
    const updateTierInfo = (tierId, name, description) => {
        setAllianceData(prev => ({
            ...prev,
            [tierId]: { ...prev[tierId], name, description }
        }));
    };

    const addTeamToTier = (team, tierId) => {
        setAllianceData(prev => {
            const newState = { ...prev };
            Object.keys(newState).forEach(key => {
                newState[key] = {
                    ...newState[key],
                    items: newState[key].items.filter(i => i.team !== team.team)
                };
            });
            const newItem = { ...team, id: `team-${team.team}` };
            newState[tierId] = {
                ...newState[tierId],
                items: [...newState[tierId].items, newItem]
            };
            return newState;
        });
    };

    const setTiers = (newTiers) => {
        setAllianceData(newTiers);
    };

    return (
        <ScoutContext.Provider value={{
            eventCode, setEventCode,
            allianceData, setTiers, updateTierInfo, addTeamToTier,
            createSession, joinSession, leaveSession, loadSessions, saveSession,
            shareSession, getSharedUsers, sessionOwner,
            sessionKey, sessionName, setSessionName, isOnline, isSaving,
            tabs, activeTabId, setActiveTabId, addTab, closeTab, reorderTabs,
            broadcastDrag, remoteDragState
        }}>
            {children}
        </ScoutContext.Provider>
    );
}

export const useScout = () => useContext(ScoutContext);
