import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTab({ tab, isActive, onActivate, onClose, onPopOut }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: tab.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        background: isActive ? 'var(--glass-bg)' : 'transparent',
        borderTopLeftRadius: '0.5rem',
        borderTopRightRadius: '0.5rem',
        border: '1px solid var(--glass-border)',
        borderBottom: isActive ? 'none' : '1px solid var(--glass-border)',
        marginBottom: '-1px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        minWidth: '120px',
        justifyContent: 'space-between',
        userSelect: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onActivate(tab.id)} onDoubleClick={(e) => { e.stopPropagation(); onPopOut(tab.id); }}>
            <span style={{ fontWeight: isActive ? 'bold' : 'normal', fontSize: '0.9rem' }}>{tab.title}</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                    className='icon-btn'
                    onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
                    title="Close Tab"
                    style={{ fontSize: '0.8rem', opacity: 0.6, cursor: 'pointer', border: 'none', background: 'transparent', color: 'inherit' }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

export default function TabBar({ tabs, activeTabId, onActivate, onClose, onReorder, onAdd, onAddAlliance, onPopOut }) {
    const { logout } = useAuth();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) {
            // Dropped outside the list -> Pop Out
            onPopOut(active.id);
            return;
        }

        if (active.id !== over.id) {
            const oldIndex = tabs.findIndex((t) => t.id === active.id);
            const newIndex = tabs.findIndex((t) => t.id === over.id);
            onReorder(arrayMove(tabs, oldIndex, newIndex));
        }
    };

    return (
        <div className="glass-panel" style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.5rem 0.5rem 0 0.5rem',
            background: 'rgba(0,0,0,0.3)',
            borderBottom: '1px solid var(--glass-border)',
            borderRadius: 0
        }}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={tabs} strategy={horizontalListSortingStrategy}>
                    <div style={{ display: 'flex', overflowX: 'auto', flex: 1 }}>
                        {tabs.map((tab) => (
                            <SortableTab
                                key={tab.id}
                                tab={tab}
                                isActive={tab.id === activeTabId}
                                onActivate={onActivate}
                                onClose={onClose}
                                onPopOut={onPopOut}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
                <button
                    onClick={onAddAlliance}
                    style={{
    padding: '0.4rem 0.75rem',           // match padding with tabs/buttons
    background: 'var(--glass-bg)',       // same glass panel background
    border: '1px solid var(--glass-border)',
    borderRadius: '0.375rem',            // consistent rounded corners
    color: 'var(--text-primary)',        // main text color
    fontSize: '0.9rem',                  // similar to tab text
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
}}
                    title="Open Alliance Board +"
                >
                    Alliance Board +
                </button>
                <button
                    onClick={onAdd}
                    style={{
    padding: '0.4rem 0.75rem',           // match padding with tabs/buttons
    background: 'var(--glass-bg)',       // same glass panel background
    border: '1px solid var(--glass-border)',
    borderRadius: '0.375rem',            // consistent rounded corners
    color: 'var(--text-primary)',        // main text color
    fontSize: '0.9rem',                  // similar to tab text
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
}}
                    title="New Tab"
                >
                    Event Search +
                </button>
                <button
                    onClick={logout}
                    style={{
    padding: '0.4rem 0.75rem',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: '0.375rem',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
}}
                    title="Log Out"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
}
