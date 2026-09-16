import React, { useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { NavigationProvider, useNavigation } from './hooks/useNavigation';
import { ToastProvider } from './hooks/useToast';
import { AudioProvider } from './contexts/AudioContext';
import { NowPlayingBar } from './components/NowPlayingBar';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { HomeView } from './views/HomeView';
import { ComposeView } from './views/ComposeView';
import { KnowledgeView } from './views/KnowledgeView';
import { RunsView } from './views/RunsView';
import { UpgradeView } from './views/UpgradeView';
import { SettingsView } from './views/SettingsView';
import { DemoDataView } from './views/DemoDataView';
import { FirebaseErrorView } from './views/FirebaseErrorView';
import { db } from './lib/firebase';

const MainContent = () => {
  const { currentView } = useNavigation();
  const online = useOnlineStatus();
  // Canonical Knowledge now reads docs/m-guide through the server API. Only Improver remains Firebase-backed.
  const needsFirebase = currentView === 'upgrade';
  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col">
      {!online && (
        <div role="status" className="flex items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <WifiOff className="h-4 w-4" /> Đang ngoại tuyến — nghe, chỉnh sửa, xuất file và dự án cục bộ vẫn hoạt động.
        </div>
      )}
      {needsFirebase && !db ? <FirebaseErrorView /> : (
        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {currentView === 'home' && <HomeView />}
          {currentView === 'compose' && <ComposeView />}
          {currentView === 'knowledge' && <KnowledgeView />}
          {currentView === 'runs' && <RunsView />}
          {currentView === 'upgrade' && <UpgradeView />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'demo' && <DemoDataView />}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <ToastProvider>
      <AudioProvider>
        <NavigationProvider>
          <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#050505] text-white selection:bg-indigo-500/30">
            <div className="relative flex flex-1 overflow-hidden">
              <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <NowPlayingBar onMenuClick={() => setIsSidebarOpen(true)} />
                <MainContent />
              </div>
            </div>
          </div>
        </NavigationProvider>
      </AudioProvider>
    </ToastProvider>
  );
}
