import { Search, Plus, FolderKey, Clock } from 'lucide-react';
import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  keys: any[];
  updatedAt: string;
  archived: boolean;
}

interface ProjectGridProps {
  projects: Project[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onProjectClick: (id: string) => void;
}

export function ProjectGrid({ projects, searchQuery, onSearchChange, onProjectClick }: ProjectGridProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRelativeTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
          <p className="text-slate-400">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} ·{' '}
            {projects.reduce((sum, p) => sum + p.keys.length, 0)} total keys
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2 justify-center"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Search */}
      {projects.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            placeholder="Search projects and keys..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length === 0 && projects.length > 0 ? (
        <div className="text-center py-16">
          <FolderKey className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400">No projects match "{searchQuery}"</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FolderKey className="w-10 h-10 text-teal-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-slate-400 mb-6">Create your first project to start organizing your API keys</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => onProjectClick(project.id)}
              className="group bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 hover:bg-slate-900/80 transition-all text-left relative overflow-hidden"
            >
              {/* Color accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1 opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: project.color }}
              />

              {/* Content */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${project.color}20` }}
                >
                  <FolderKey className="w-5 h-5" style={{ color: project.color }} />
                </div>
                <div className="text-xs text-slate-500 font-mono">{project.keys.length} keys</div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-teal-400 transition-colors">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(project.updatedAt)}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Create Project</h2>
            <p className="text-slate-400 mb-6">This is a demo - project creation coming soon</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
