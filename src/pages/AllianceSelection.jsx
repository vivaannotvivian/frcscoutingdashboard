import { useState, useEffect } from 'react';

import { getEventTeamStats } from '../api/statbotics';
import { useScout } from '../context/ScoutContext';
import { useAuth } from '../context/AuthContext';
import TeamContextMenu from '../components/TeamContextMenu';
import ShareModal from '../components/ShareModal';
import SessionSelector from '../components/SessionSelector';
import supabase from '../supabaseClient';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, team, onContextMenu, isRemoteDragging }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging // Local dragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        padding: '0.75rem',
        marginBottom: '0.5rem',
        background: isRemoteDragging ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: '0.25rem',
        cursor: 'grab',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        touchAction: 'none',
        border: isRemoteDragging ? '2px dashed var(--danger)' : isDragging ? '1px solid var(--accent-primary)' : '1px solid transparent',
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onContextMenu={(e) => onContextMenu(e, team)}
        >
            <span style={{ fontWeight: 'bold' }}>{team.team}</span>

            {isRemoteDragging && <span style={{ fontSize: '0.7rem', color: 'var(--danger)', marginLeft: '0.5rem' }}>Moving...</span>}

            <div style={{ textAlign: 'right', fontSize: '0.8rem', marginLeft: 'auto' }}>
                <div style={{ color: 'var(--text-secondary)' }}>EPA: {team.epa_total?.toFixed(1)}</div>
                {team.epa_auto && <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Auto: {team.epa_auto.toFixed(1)}</div>}
            </div>
        </div>
    );
}

function TierHeader({ tier, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(tier.name);
    const [desc, setDesc] = useState(tier.description);

    const handleSave = () => {
        onUpdate(tier.id, name, desc);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div style={{ marginBottom: '1rem', borderBottom: `2px solid ${tier.color}`, paddingBottom: '0.5rem' }}>
                <input
                    className="input-field"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}
                    autoFocus
                />
                <input
                    className="input-field"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'var(--success)' }} onClick={handleSave}>Save</button>
                    <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'var(--bg-secondary)' }} onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{ marginBottom: '1rem', cursor: 'pointer', borderBottom: `4px solid ${tier.color}`, paddingBottom: '0.5rem' }}
            onDoubleClick={() => setIsEditing(true)}
            title="Double click to edit"
        >
            <h3 style={{ color: tier.color, margin: 0 }}>{tier.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({tier.items.length})</span></h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{tier.description}</p>
        </div>
    );
}

function DroppableContainer({ id, items, tier, updateTierInfo, onContextMenu, remoteDragState }) {
    const { setNodeRef } = useSortable({ id });

    return (
        <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
            <div
                ref={setNodeRef}
                className="glass-panel"
                style={{
                    padding: '1rem',
                    minHeight: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <TierHeader tier={tier} onUpdate={updateTierInfo} />
                <div style={{ flex: 1 }}>
                    {items && items.filter(i => i && i.id).map((item) => (
                        <SortableItem
                            key={item.id}
                            id={item.id}
                            team={item}
                            onContextMenu={onContextMenu}
                            isRemoteDragging={remoteDragState[item.id]}
                        />
                    ))}
                </div>
            </div>
        </SortableContext>
    );
}

export default function AllianceSelection() {
    const { eventCode, setEventCode, allianceData, setTiers, updateTierInfo, createSession, joinSession, leaveSession, sessionKey, sessionName, setSessionName, isOnline, isSaving, saveSession, sessionOwner, broadcastDrag, remoteDragState, tabs, setActiveTabId } = useScout();
    const { user } = useAuth();
    const [activeId, setActiveId] = useState(null);
    const [localEventCode, setLocalEventCode] = useState(eventCode);
    const [contextMenu, setContextMenu] = useState(null);
    const [showShare, setShowShare] = useState(false);
    const [hasEverJoined, setHasEverJoined] = useState(false);

    useEffect(() => {
        setLocalEventCode(eventCode);
    }, [eventCode]);

    // Track if user has ever been online in this session
    useEffect(() => {
        if (isOnline) {
            setHasEverJoined(true);
        }
    }, [isOnline]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!localEventCode) return;
        setEventCode(localEventCode);
        try {
            const stats = await getEventTeamStats(localEventCode);
            const poolItems = stats.map(t => ({ ...t, id: `team-${t.team}` }));

            const newTiers = { ...allianceData };
            Object.keys(newTiers).forEach(key => {
                newTiers[key] = { ...newTiers[key], items: [] };
            });
            newTiers.POOL.items = poolItems;
            setTiers(newTiers);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch event data');
        }
    };

    // Supabase Handlers
    const handleCreateSession = async () => {
        if (!eventCode) {
            alert("Please load an event first.");
            return;
        }
        const id = await createSession();
        if (id) {
            alert(`Session Created! Share this ID: ${id}`);
        } else {
            alert("Failed to create session. Check console.");
        }
    };

    const handleJoinSession = async () => {
        if (!joinId) return;
        const success = await joinSession(joinId);
        if (!success) {
            alert("Could not join session. Check ID.");
        } else {
            setShowJoin(false);
            setJoinId('');
            alert("Connected!");
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(allianceData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `alliance_selection_${eventCode}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                setTiers(json);
                alert("Import successful!");
            } catch (err) {
                alert("Invalid JSON file");
            }
        };
        reader.readAsText(file);
        e.target.value = null; // reset
    };

    const handleOpenNewWindow = () => {
        const url = window.location.href;
        window.open(url, '_blank', 'width=1200,height=800');
    };

    const handleGoBack = () => {
        leaveSession();
        setHasEverJoined(false);
    };

    const findContainer = (id) => {
        if (id in allianceData) return id;
        return Object.keys(allianceData).find((key) => allianceData[key].items.find((item) => item.id === id));
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
        broadcastDrag(event.active.id, true);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) return;

        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setTiers((prev) => {
            const activeItems = prev[activeContainer].items;
            const overItems = prev[overContainer].items;
            const activeIndex = activeItems.findIndex((i) => i.id === active.id);
            const overIndex = overItems.findIndex((i) => i.id === overId);

            let newIndex;
            if (overId in prev) {
                newIndex = overItems.length + 1;
            } else {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: {
                    ...prev[activeContainer],
                    items: [...prev[activeContainer].items.filter((item) => item.id !== active.id)]
                },
                [overContainer]: {
                    ...prev[overContainer],
                    items: [
                        ...prev[overContainer].items.slice(0, newIndex),
                        activeItems[activeIndex],
                        ...prev[overContainer].items.slice(newIndex, prev[overContainer].items.length)
                    ]
                }
            };
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        broadcastDrag(active.id, false); // Stop highlighting

        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over?.id);

        if (activeContainer && overContainer && activeContainer === overContainer) {
            const activeIndex = allianceData[activeContainer].items.findIndex((i) => i.id === active.id);
            const overIndex = allianceData[overContainer].items.findIndex((i) => i.id === over?.id);

            if (activeIndex !== overIndex) {
                setTiers((prev) => ({
                    ...prev,
                    [activeContainer]: {
                        ...prev[activeContainer],
                        items: arrayMove(prev[activeContainer].items, activeIndex, overIndex)
                    }
                }));
            }
        }
        setActiveId(null);
    };

    const handleContextMenu = (e, team) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, team });
    };

    if (!allianceData || Object.keys(allianceData).length === 0) {
        return <div className="container" style={{ padding: '2rem' }}>Loading data...</div>;
    }

    // Show session selector if not online
    if (!isOnline) {
        return <SessionSelector onSessionSelected={() => { }} onGoBack={hasEverJoined ? handleGoBack : null} />;
    }

    const activeItem = activeId ? Object.values(allianceData).flatMap(t => t?.items || []).filter(i => i && i.id).find(i => i.id === activeId) : null;

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1800px' }}>
            <h1 style={{ marginBottom: '1.5rem' }}>Alliance Selection Board</h1>
            
            {/* Only show Back to Menu if user has joined/created a session */}
            {hasEverJoined && (
                <button className="btn" style={{ marginBottom: '1rem', background: 'var(--accent-primary)' }} onClick={handleGoBack}>← Back to Menu</button>
            )}

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Event Code (e.g., 2024tur)"
                            value={localEventCode}
                            onChange={(e) => setLocalEventCode(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">Load Data / Reset</button>
                    </form>

                    {/* Realtime UI */}
                    <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto', alignItems: 'center' }}>
                        {isOnline ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '0.5rem', border: '1px solid var(--success)', fontWeight: 'bold', color: 'var(--success)', fontSize: '0.9rem' }}>
                                <span>● Online</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    className="input-field"
                                    placeholder="Session Name"
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                    style={{ padding: '0.5rem' }}
                                />
                                <button className="btn" style={{ background: 'var(--accent-primary)' }} onClick={() => createSession(sessionName)}>Start Session</button>
                            </div>
                        )}

                        {isOnline && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    className="input-field"
                                    placeholder="Session Name"
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                    style={{ padding: '0.5rem' }}
                                />
                                <button
                                    className="btn"
                                    style={{ background: 'var(--accent-primary)', opacity: isSaving ? 0.7 : 1 }}
                                    onClick={saveSession}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                {sessionOwner === user?.id && (
                                    <button
                                        className="btn"
                                        style={{ background: 'var(--accent-secondary)' }}
                                        onClick={() => setShowShare(true)}
                                    >
                                        Share
                                    </button>
                                )}
                            </div>
                        )}



                        <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>

                        <button className="btn" style={{ background: 'var(--bg-secondary)' }} onClick={handleExport}>Export</button>
                        <label className="btn" style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}>
                            Import
                            <input type="file" onChange={handleImport} accept=".json" style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', alignItems: 'start' }}>
                    {['POOL', 'S', 'A', 'B', 'C', 'DNP'].map((tierId) => (
                        allianceData[tierId] ? (
                            <DroppableContainer
                                key={tierId}
                                id={tierId}
                                tier={allianceData[tierId]}
                                items={allianceData[tierId].items || []}
                                updateTierInfo={updateTierInfo}
                                onContextMenu={handleContextMenu}
                                remoteDragState={remoteDragState}
                            />
                        ) : null
                    ))}
                </div>

                <DragOverlay>
                    {activeItem ? (
                        <div className="glass-panel" style={{
                            padding: '0.75rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--accent-primary)',
                            cursor: 'grabbing'
                        }}>
                            <span style={{ fontWeight: 'bold' }}>{activeItem.team}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {showShare && (
                <ShareModal onClose={() => setShowShare(false)} />
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