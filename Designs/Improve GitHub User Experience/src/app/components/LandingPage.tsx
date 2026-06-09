import { useState } from 'react';
import { Lock, Key, Shield, Zap, Download, Eye, EyeOff, ArrowRight, Check, Github } from 'lucide-react';

interface LandingPageProps {
  onAuthenticate: () => void;
}

export function LandingPage({ onAuthenticate }: LandingPageProps) {
  const [showUnlock, setShowUnlock] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUnlocking(true);
    // Simulate unlock
    await new Promise(resolve => setTimeout(resolve, 1200));
    onAuthenticate();
  };

  if (showUnlock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Back button */}
          <button
            onClick={() => setShowUnlock(false)}
            className="mb-6 text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-2 text-sm"
          >
            ← Back to home
          </button>

          {/* Unlock card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/20">
              <Lock className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">Unlock Vault</h1>
            <p className="text-slate-400 mb-8">Enter your master password to access your encrypted keys</p>

            <form onSubmit={handleUnlock} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!password || isUnlocking}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUnlocking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    Unlock Vault
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-xs text-slate-500 text-center">
                🔒 AES-256-GCM encryption · PBKDF2 310k iterations
              </p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Zero backend
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-4 h-4" />
              Local only
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg" />
            <div>
              <div className="font-bold text-white text-lg">KeyVault Sidekick</div>
              <div className="text-xs text-slate-500">by VibeProSoft</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/boblauzon/keyvault-sidekick"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <button
              onClick={() => setShowUnlock(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-xs font-medium mb-6">
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              Invitation-only · Audited · v2.0
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Your API keys,
              <br />
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                encrypted locally
              </span>
            </h1>
            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              Browser-only encrypted secrets vault for developers. Zero backend, zero sign-up, zero breach surface.
              Keys never leave your device.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowUnlock(true)}
                className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2 text-lg"
              >
                Open Vault
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#features"
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
              >
                Learn More
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-400" />
                AES-256-GCM
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-teal-400" />
                PBKDF2 310k
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-teal-400" />
                Zero backend
              </div>
            </div>
          </div>

          {/* Vault Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur-2xl opacity-20" />
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1">Project</div>
                  <div className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-3 h-3 bg-teal-500 rounded" />
                    ITIL Sidekick
                  </div>
                </div>
                <div className="text-xs text-slate-500">4 keys</div>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'STRIPE_API_KEY', type: 'api_key' },
                  { name: 'CLERK_SECRET', type: 'secret' },
                  { name: 'CLOUDFLARE_TOKEN', type: 'api_key' },
                  { name: 'DATABASE_URL', type: 'other' },
                ].map((key, i) => (
                  <div
                    key={i}
                    className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-sm text-white">{key.name}</div>
                      <span className="text-xs px-2 py-1 bg-teal-500/10 text-teal-400 rounded border border-teal-500/20">
                        {key.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono text-xs text-slate-600">••••••••••••</div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-teal-400 text-xs">
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Everything you need</h2>
          <p className="text-xl text-slate-400">Built for solo developers who value simplicity and security</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: 'Military-grade encryption',
              description: 'AES-256-GCM with PBKDF2 key derivation. Your master password never leaves the browser.',
            },
            {
              icon: Zap,
              title: 'Lightning fast',
              description: 'No sign-up, no sync, no waiting. Open and use instantly. Everything runs locally.',
            },
            {
              icon: Key,
              title: '7 built-in generators',
              description: 'JWT secrets, UUIDs, API keys, passwords, and more. Save directly to projects.',
            },
            {
              icon: Download,
              title: 'One-click export',
              description: 'Export to .env, .envrc, or settings.json format. Perfect for Claude Code integration.',
            },
            {
              icon: Lock,
              title: 'Project organization',
              description: 'Group keys by project. Search, filter, archive. Keep your secrets organized.',
            },
            {
              icon: Check,
              title: 'Auto-lock & clipboard clear',
              description: 'Configurable idle timeout and automatic clipboard clearing after copying secrets.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to secure your keys?</h2>
          <p className="text-slate-400 mb-8 text-lg">
            KeyVault Sidekick is invitation-only during early access
          </p>
          <button
            onClick={() => setShowUnlock(true)}
            className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all inline-flex items-center gap-2"
          >
            Open Vault
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            © 2026 VibeProSoft · <a href="https://github.com/boblauzon/keyvault-sidekick" className="hover:text-slate-400 transition-colors">GitHub</a>
          </div>
          <div className="text-sm text-slate-500">v2.0.2 · Audited 2026-06-08</div>
        </div>
      </footer>
    </div>
  );
}
