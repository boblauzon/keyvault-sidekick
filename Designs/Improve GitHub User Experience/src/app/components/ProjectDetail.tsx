import { ArrowLeft, Plus, Key, Copy, Eye, EyeOff, Edit2, Trash2, Check, Download } from 'lucide-react';
import { useState } from 'react';

interface KeyItem {
  id: string;
  name: string;
  value: string;
  type: string;
  notes: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  keys: KeyItem[];
  updatedAt: string;
  archived: boolean;
}

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  api_key: 'text-blue-400 border-blue-400/20 bg-blue-400/10',
  secret: 'text-rose-400 border-rose-400/20 bg-rose-400/10',
  token: 'text-purple-400 border-purple-400/20 bg-purple-400/10',
  oauth: 'text-amber-400 border-amber-400/20 bg-amber-400/10',
  webhook: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10',
  other: 'text-slate-400 border-slate-400/20 bg-slate-400/10',
};

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleReveal = (keyId: string) => {
    setRevealedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (keyId: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${project.color}20` }}
            >
              <Key className="w-7 h-7" style={{ color: project.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{project.name}</h1>
              {project.description && (
                <p className="text-slate-400 mb-2">{project.description}</p>
              )}
              <p className="text-sm text-slate-500">
                {project.keys.length} {project.keys.length === 1 ? 'key' : 'keys'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              Import .env
            </button>
          </div>
        </div>
      </div>

      {/* Add Key Button */}
      {project.keys.length > 0 && (
        <button className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2 justify-center">
          <Plus className="w-5 h-5" />
          Add Key
        </button>
      )}

      {/* Keys List */}
      {project.keys.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Key className="w-10 h-10 text-teal-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No keys yet</h3>
          <p className="text-slate-400 mb-6">Add your first API key to this project</p>
          <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add First Key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {project.keys.map((key) => {
            const isRevealed = revealedKeys.has(key.id);
            const isCopied = copiedKey === key.id;

            return (
              <div
                key={key.id}
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-mono text-sm font-semibold text-white">{key.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded border ${TYPE_COLORS[key.type]}`}>
                        {key.type.replace('_', ' ')}
                      </span>
                    </div>
                    {key.notes && (
                      <p className="text-sm text-slate-400 mb-3">{key.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 font-mono text-sm overflow-x-auto">
                    {isRevealed ? (
                      <span className="text-slate-300">{key.value}</span>
                    ) : (
                      <span className="text-slate-600">{'•'.repeat(Math.min(key.value.length, 40))}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleReveal(key.id)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title={isRevealed ? 'Hide' : 'Reveal'}
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(key.id, key.value)}
                      className={`p-2 rounded-lg transition-all ${
                        isCopied
                          ? 'text-teal-400 bg-teal-400/10'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title="Copy"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
