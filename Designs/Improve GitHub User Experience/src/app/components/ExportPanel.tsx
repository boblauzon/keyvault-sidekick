import { useState } from 'react';
import { Download, Copy, Check, FileText } from 'lucide-react';

interface ExportPanelProps {
  projects: any[];
}

type ExportFormat = 'env' | 'envrc' | 'json';

export function ExportPanel({ projects }: ExportPanelProps) {
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<ExportFormat>('env');
  const [copied, setCopied] = useState(false);

  const project = projects.find(p => p.id === selectedProject);
  const allKeysSelected = project && selectedKeys.size === project.keys.length;

  const toggleKey = (keyId: string) => {
    setSelectedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const toggleAllKeys = () => {
    if (allKeysSelected) {
      setSelectedKeys(new Set());
    } else if (project) {
      setSelectedKeys(new Set(project.keys.map((k: any) => k.id)));
    }
  };

  const generateOutput = () => {
    if (!project) return '';

    const selectedKeyObjects = project.keys.filter((k: any) => selectedKeys.has(k.id));

    switch (format) {
      case 'env':
        return selectedKeyObjects.map((k: any) => `${k.name}="${k.value}"`).join('\n');

      case 'envrc':
        return selectedKeyObjects.map((k: any) => `export ${k.name}="${k.value}"`).join('\n');

      case 'json':
        const obj = Object.fromEntries(selectedKeyObjects.map((k: any) => [k.name, k.value]));
        return JSON.stringify({ env: obj }, null, 2);

      default:
        return '';
    }
  };

  const output = generateOutput();

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = format === 'json' ? 'json' : format === 'envrc' ? '.envrc' : '.env';
    a.download = `${project?.name.toLowerCase().replace(/\s+/g, '-')}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Export</h1>
        <p className="text-slate-400">Export your keys to .env, .envrc, or JSON format</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Panel - Configuration */}
        <div className="space-y-6">
          {/* Project Selection */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Select Project</h2>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedKeys(new Set());
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.keys.length} keys)
                </option>
              ))}
            </select>
          </div>

          {/* Format Selection */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Export Format</h2>
            <div className="space-y-2">
              {[
                { id: 'env', label: '.env', desc: 'KEY="value"' },
                { id: 'envrc', label: '.envrc (direnv)', desc: 'export KEY="value"' },
                { id: 'json', label: 'settings.json', desc: '{ "env": { ... } }' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id as ExportFormat)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    format === fmt.id
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium">{fmt.label}</div>
                  <div className="text-xs font-mono opacity-60">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Key Selection */}
          {project && (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Select Keys</h2>
                <button
                  onClick={toggleAllKeys}
                  className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
                >
                  {allKeysSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {project.keys.map((key: any) => (
                  <label
                    key={key.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(key.id)}
                      onChange={() => toggleKey(key.id)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="flex-1 font-mono text-sm text-white">{key.name}</span>
                    <span className="text-xs text-slate-500">{key.type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Preview & Actions */}
        <div className="space-y-4">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Preview</h2>
              <div className="text-sm text-slate-500">
                {selectedKeys.size} {selectedKeys.size === 1 ? 'key' : 'keys'} selected
              </div>
            </div>

            {output ? (
              <>
                <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 mb-4 max-h-96 overflow-auto">
                  <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap break-all">
                    {output}
                  </pre>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyOutput}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      copied
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-teal-500/25'
                    }`}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                  <button
                    onClick={downloadOutput}
                    className="px-4 py-3 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-medium transition-all"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select keys to preview export</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
