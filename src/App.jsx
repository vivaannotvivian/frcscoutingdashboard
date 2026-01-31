import { useState, useEffect } from 'react';
import Home from './pages/Home';
import TeamDetails from './pages/TeamDetails';
import AllianceSelection from './pages/AllianceSelection';
import Login from './pages/Login';
import { ScoutProvider, useScout } from './context/ScoutContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import TabBar from './components/TabBar';

function AppContent() {
  const { tabs, activeTabId, setActiveTabId, closeTab, reorderTabs, addTab } = useScout();

  const handlePopOut = (id) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;
    let path = '/';
    if (tab.type === 'ALLIANCE') path = '/alliance-selection';
    if (tab.type === 'TEAM') path = `/team/${tab.data?.team}`;
    window.open(path, '_blank', 'width=1200,height=800');
  };

  // Content Renderer
  const renderContent = () => {
    return tabs.map(tab => {
      const isActive = tab.id === activeTabId;
      return (
        <div key={tab.id} style={{ display: isActive ? 'block' : 'none', height: 'calc(100vh - 45px)', overflowY: 'auto' }}>
          {tab.type === 'HOME' && <Home />}
          {tab.type === 'ALLIANCE' && <AllianceSelection />}
          {tab.type === 'TEAM' && <TeamDetails teamKey={tab.data?.team} />}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onActivate={setActiveTabId}
        onClose={closeTab}
        onReorder={reorderTabs}
        onAdd={() => addTab('HOME', {}, 'Event Search')}
        onAddAlliance={() => addTab('ALLIANCE', {}, 'Alliance Board')}
        onPopOut={handlePopOut}
      />
      <div style={{ flex: 1, position: 'relative' }}>
        {renderContent()}
      </div>
    </div>
  );
}

// Router-less Popout View logic is redundant if we wrap root in Router.
// But we have AppContent logic that wants to use "Link" potentially.
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function CurrentView() {
  const isPopOut = window.location.pathname !== '/' && window.location.pathname !== '/index.html';

  if (isPopOut) {
    return (
      <Routes>
        <Route path="/alliance-selection" element={<AllianceSelection />} />
        <Route path="/team/:teamKey" element={<TeamDetails />} />
      </Routes>
    );
  }

  return <AppContent />;
}

function MainLayout() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Loading session...</div>;
  if (!user) return <Login />;

  return (
    <ScoutProvider>
      <BrowserRouter basename="/frcscoutingdashboard">
        <CurrentView />
      </BrowserRouter>
    </ScoutProvider>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
