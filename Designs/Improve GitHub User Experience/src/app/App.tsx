import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { VaultApp } from './components/VaultApp';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-mono">Loading vault...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  return <VaultApp onSignOut={() => setIsAuthenticated(false)} />;
}