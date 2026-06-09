import { Shield, Clock, Clipboard, Download, Upload, Trash2, Lock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export function SettingsPanel() {
  const [idleTimeout, setIdleTimeout] = useState(15);
  const [clipboardClear, setClipboardClear] = useState(30);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Customize your vault security and preferences</p>
      </div>

      {/* Security Settings */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Security</h2>
            <p className="text-sm text-slate-400">Auto-lock and clipboard settings</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Auto-lock */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="font-medium text-white">Auto-lock timeout</h3>
              </div>
              <p className="text-sm text-slate-400">Lock vault after period of inactivity</p>
            </div>
            <select
              value={idleTimeout}
              onChange={(e) => setIdleTimeout(Number(e.target.value))}
              className="w-40 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={0}>Never</option>
            </select>
          </div>

          <div className="border-t border-slate-800 pt-6" />

          {/* Clipboard Clear */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Clipboard className="w-4 h-4 text-slate-400" />
                <h3 className="font-medium text-white">Clipboard auto-clear</h3>
              </div>
              <p className="text-sm text-slate-400">Automatically clear clipboard after copying secrets</p>
            </div>
            <select
              value={clipboardClear}
              onChange={(e) => setClipboardClear(Number(e.target.value))}
              className="w-40 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={0}>Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Password */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Master Password</h2>
            <p className="text-sm text-slate-400">Change your vault encryption password</p>
          </div>
        </div>

        <button className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Change Master Password
        </button>
      </div>

      {/* Vault Backup */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Vault Backup</h2>
            <p className="text-sm text-slate-400">Export or import encrypted vault file</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 justify-center">
            <Download className="w-4 h-4" />
            Export .vault File
          </button>
          <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 justify-center">
            <Upload className="w-4 h-4" />
            Import .vault File
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-400 flex items-start gap-2">
            <span className="text-lg">💡</span>
            <span>
              The .vault file contains your encrypted keys. You'll need your master password to restore it.
              Keep it safe!
            </span>
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-500/5 border-2 border-rose-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Danger Zone</h2>
            <p className="text-sm text-slate-400">Irreversible and destructive actions</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="font-medium text-white mb-1">Wipe Vault</h3>
              <p className="text-sm text-slate-400">
                Permanently delete all projects and keys. This cannot be undone.
              </p>
            </div>
            <button className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Wipe Vault
            </button>
          </div>
        </div>
      </div>

      {/* Integrity Info */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Security Information</h2>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Encryption</span>
            <span className="font-mono text-slate-300">AES-256-GCM</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Key Derivation</span>
            <span className="font-mono text-slate-300">PBKDF2 (310k iterations)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Hash Algorithm</span>
            <span className="font-mono text-slate-300">SHA-256</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-400">Version</span>
            <span className="font-mono text-slate-300">v2.0.2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
