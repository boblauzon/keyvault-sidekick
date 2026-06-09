import { useState } from 'react';
import { Search, Plus, Settings, LogOut, FolderKey, Sparkles, Download, User, Menu, X } from 'lucide-react';
import { ProjectGrid } from './ProjectGrid';
import { ProjectDetail } from './ProjectDetail';
import { GeneratorPanel } from './GeneratorPanel';
import { ExportPanel } from './ExportPanel';
import { SettingsPanel } from './SettingsPanel';

interface VaultAppProps {
  onSignOut: () => void;
}

type View = 'projects' | 'project' | 'generator' | 'export' | 'settings';

export function VaultApp({ onSignOut }: VaultAppProps) {
  const [currentView, setCurrentView] = useState<View>('projects');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock data
  const [projects] = useState([
    {
      id: '1',
      name: 'ITIL Sidekick',
      description: 'Production SaaS platform',
      color: '#2dd4bf',
      keys: [
        { id: 'k1', name: 'STRIPE_API_KEY', value: 'sk_live_xxxxx', type: 'api_key', notes: 'Production key' },
        { id: 'k2', name: 'CLERK_SECRET', value: 'clerk_xxxxx', type: 'secret', notes: '' },
        { id: 'k3', name: 'CLOUDFLARE_TOKEN', value: 'cf_xxxxx', type: 'api_key', notes: 'Zone access' },
        { id: 'k4', name: 'DATABASE_URL', value: 'postgres://xxxxx', type: 'other', notes: '' },
      ],
      updatedAt: '2026-06-09T10:30:00Z',
      archived: false,
    },
    {
      id: '2',
      name: 'Personal Blog',
      description: 'Astro + Cloudflare Pages',
      color: '#c084fc',
      keys: [
        { id: 'k5', name: 'ANALYTICS_KEY', value: 'xxxxx', type: 'api_key', notes: '' },
        { id: 'k6', name: 'CMS_TOKEN', value: 'xxxxx', type: 'token', notes: '' },
      ],
      updatedAt: '2026-06-08T15:20:00Z',
      archived: false,
    },
    {
      id: '3',
      name: 'Mobile App',
      description: 'React Native + Supabase',
      color: '#60a5fa',
      keys: [
        { id: 'k7', name: 'SUPABASE_URL', value: 'https://xxxxx.supabase.co', type: 'other', notes: '' },
        { id: 'k8', name: 'SUPABASE_ANON_KEY', value: 'xxxxx', type: 'api_key', notes: '' },
        { id: 'k9', name: 'GOOGLE_OAUTH_CLIENT', value: 'xxxxx', type: 'oauth', notes: '' },
      ],
      updatedAt: '2026-06-07T09:15:00Z',
      archived: false,
    },
  ]);

  const currentProject = currentProjectId ? projects.find(p => p.id === currentProjectId) : null;

  const navigateTo = (view: View, projectId?: string) => {
    setCurrentView(view);
    if (projectId) setCurrentProjectId(projectId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <FolderKey className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-white text-sm sm:text-base">KeyVault</div>
                <div className="text-xs text-slate-500 hidden sm:block">Unlocked</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <button
                onClick={() => navigateTo('projects')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'projects' || currentView === 'project'
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Projects
              </button>
              <button
                onClick={() => navigateTo('generator')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  currentView === 'generator'
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Generator
              </button>
              <button
                onClick={() => navigateTo('export')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  currentView === 'export'
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('settings')}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onSignOut}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Sign Out</span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-800">
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => navigateTo('projects')}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                    currentView === 'projects' || currentView === 'project'
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Projects
                </button>
                <button
                  onClick={() => navigateTo('generator')}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    currentView === 'generator'
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Generator
                </button>
                <button
                  onClick={() => navigateTo('export')}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    currentView === 'export'
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={onSignOut}
                  className="px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'projects' && (
          <ProjectGrid
            projects={projects}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onProjectClick={(id) => navigateTo('project', id)}
          />
        )}
        {currentView === 'project' && currentProject && (
          <ProjectDetail
            project={currentProject}
            onBack={() => navigateTo('projects')}
          />
        )}
        {currentView === 'generator' && <GeneratorPanel projects={projects} />}
        {currentView === 'export' && <ExportPanel projects={projects} />}
        {currentView === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}
