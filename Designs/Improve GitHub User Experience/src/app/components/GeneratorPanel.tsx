import { useState } from 'react';
import { Sparkles, Copy, Check, Save, Dices } from 'lucide-react';

interface GeneratorPanelProps {
  projects: any[];
}

type GeneratorType = 'jwt' | 'uuid' | 'hex' | 'base64' | 'apikey' | 'password';

const GENERATORS: Array<{ id: GeneratorType; label: string; icon: string }> = [
  { id: 'jwt', label: 'JWT Secret', icon: '🔐' },
  { id: 'uuid', label: 'UUID v4', icon: '🆔' },
  { id: 'hex', label: 'Random Hex', icon: '#️⃣' },
  { id: 'base64', label: 'Base64', icon: '🔤' },
  { id: 'apikey', label: 'API Key', icon: '🔑' },
  { id: 'password', label: 'Password', icon: '🔒' },
];

export function GeneratorPanel({ projects }: GeneratorPanelProps) {
  const [activeGen, setActiveGen] = useState<GeneratorType>('jwt');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  // Generator options
  const [jwtBits, setJwtBits] = useState<256 | 512>(256);
  const [hexBytes, setHexBytes] = useState(32);
  const [base64Bytes, setBase64Bytes] = useState(32);
  const [apiKeyPrefix, setApiKeyPrefix] = useState('sk-');
  const [apiKeyLength, setApiKeyLength] = useState(40);
  const [passwordLength, setPasswordLength] = useState(24);
  const [passwordOptions, setPasswordOptions] = useState({
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: false,
  });

  const generate = () => {
    let result = '';

    switch (activeGen) {
      case 'jwt':
        const bytes = jwtBits === 512 ? 64 : 32;
        result = Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        break;

      case 'uuid':
        result = crypto.randomUUID();
        break;

      case 'hex':
        result = Array.from(crypto.getRandomValues(new Uint8Array(hexBytes)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        break;

      case 'base64':
        const b64Bytes = crypto.getRandomValues(new Uint8Array(base64Bytes));
        result = btoa(String.fromCharCode(...Array.from(b64Bytes)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
        break;

      case 'apikey':
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const random = Array.from(crypto.getRandomValues(new Uint8Array(apiKeyLength)))
          .map(b => charset[b % charset.length])
          .join('');
        result = apiKeyPrefix + random;
        break;

      case 'password':
        let chars = '';
        if (passwordOptions.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (passwordOptions.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (passwordOptions.digits) chars += '0123456789';
        if (passwordOptions.symbols) chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';
        result = Array.from(crypto.getRandomValues(new Uint8Array(passwordLength)))
          .map(b => chars[b % chars.length])
          .join('');
        break;
    }

    setOutput(result);
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Generator</h1>
        <p className="text-slate-400">Generate secure random values for your projects</p>
      </div>

      {/* Generator Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {GENERATORS.map((gen) => (
          <button
            key={gen.id}
            onClick={() => setActiveGen(gen.id)}
            className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              activeGen === gen.id
                ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-400 border-2 border-teal-500/30'
                : 'bg-slate-900/50 text-slate-400 border-2 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <span className="text-lg">{gen.icon}</span>
            {gen.label}
          </button>
        ))}
      </div>

      {/* Generator Panel */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        {/* Options */}
        <div className="mb-6 space-y-4">
          {activeGen === 'jwt' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Bit Length</label>
              <div className="flex gap-2">
                {[256, 512].map((bits) => (
                  <button
                    key={bits}
                    onClick={() => setJwtBits(bits as 256 | 512)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      jwtBits === bits
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {bits} bits
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeGen === 'hex' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Byte Length</label>
              <div className="flex gap-2">
                {[16, 32, 64].map((bytes) => (
                  <button
                    key={bytes}
                    onClick={() => setHexBytes(bytes)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      hexBytes === bytes
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {bytes} bytes
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeGen === 'base64' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Byte Length</label>
              <input
                type="number"
                min="8"
                max="256"
                value={base64Bytes}
                onChange={(e) => setBase64Bytes(parseInt(e.target.value) || 32)}
                className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {activeGen === 'apikey' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Prefix</label>
                <input
                  type="text"
                  value={apiKeyPrefix}
                  onChange={(e) => setApiKeyPrefix(e.target.value)}
                  placeholder="sk-"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Length (after prefix)</label>
                <input
                  type="number"
                  min="8"
                  max="128"
                  value={apiKeyLength}
                  onChange={(e) => setApiKeyLength(parseInt(e.target.value) || 40)}
                  className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {activeGen === 'password' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Length</label>
                <input
                  type="number"
                  min="8"
                  max="128"
                  value={passwordLength}
                  onChange={(e) => setPasswordLength(parseInt(e.target.value) || 24)}
                  className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Character Types</label>
                <div className="space-y-2">
                  {Object.entries(passwordOptions).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setPasswordOptions({ ...passwordOptions, [key]: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-sm text-slate-300 capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={generate}
          className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2 mb-4"
        >
          <Dices className="w-5 h-5" />
          Generate
        </button>

        {/* Output */}
        {output && (
          <div className="space-y-3">
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 font-mono text-sm text-teal-400 break-all">
              {output}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyOutput}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  copied
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-medium transition-all flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save to Project
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
