import React, { createContext, useContext, useState } from 'react';

type View = 'home' | 'compose' | 'knowledge' | 'runs' | 'upgrade' | 'settings' | 'demo';

interface NavigationContextType {
  currentView: View;
  navigate: (view: View) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<View>('home');

  return (
    <NavigationContext.Provider value={{ currentView, navigate: setCurrentView }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
