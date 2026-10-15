import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Wifi, 
  ExternalLink, 
  Copy, 
  Check, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  Server, 
  Zap, 
  X, 
  RefreshCw,
  QrCode,
  Globe
} from 'lucide-react';

interface MobileDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDeploymentModal: React.FC<MobileDeploymentModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'s25' | 'adb' | 'capacitor' | 'static'>('s25');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [localIp, setLocalIp] = useState<string>('10.92.248.200');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Attempt to read current host IP from window.location
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setLocalIp(window.location.hostname);
    }
  }, []);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const devUrl = `http://${localIp}:5173/`;
  const prodUrl = `http://${localIp}:8080/`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-[#12141e] border border-[#262a3d] w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#222638] flex items-center justify-between bg-gradient-to-r from-[#171a29] to-[#12141e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Mobile Deployment & Android Hub
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
                  Samsung S25 Ultra Optimized
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Phase 11: Standalone WebAPK, Wireless ADB Sideloading, and Production Static Server
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#202538] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#222638] bg-[#0e1017] px-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('s25')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 's25'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Smartphone size={14} />
            <span>Samsung S25 WebAPK (Instant)</span>
          </button>
          <button
            onClick={() => setActiveTab('adb')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'adb'
                ? 'border-indigo-400 text-indigo-300 bg-indigo-950/20'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Terminal size={14} />
            <span>Wireless ADB Debugging</span>
          </button>
          <button
            onClick={() => setActiveTab('static')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'static'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Server size={14} />
            <span>Self-Hosted Static Server</span>
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'capacitor'
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers size={14} />
            <span>Capacitor Android Project</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* TAB 1: Samsung Galaxy S25 Ultra WebAPK */}
          {activeTab === 's25' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border border-cyan-800/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                      <Zap size={15} className="text-cyan-400" />
                      Zero-Install Native WebAPK Minting
                    </h4>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                      Android automatically compiles and installs a signed native APK directly on your phone when opened in Samsung Internet or Google Chrome. No Android Studio, USB cables, or SDK installation required!
                    </p>
                  </div>
                </div>
              </div>

              {/* Endpoint Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#171a26] border border-[#282d42] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Dev Server (Live HMR)</span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">Port 5173</span>
                  </div>
                  <div className="font-mono text-xs text-white bg-[#0f1118] p-2 rounded-lg border border-[#202538] flex items-center justify-between">
                    <span className="truncate">{devUrl}</span>
                    <button 
                      onClick={() => handleCopy(devUrl, 'devUrl')}
                      className="text-gray-400 hover:text-cyan-300 p-1 transition-colors"
                      title="Copy URL"
                    >
                      {copiedKey === 'devUrl' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#171a26] border border-[#282d42] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Production Static Server</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Port 8080</span>
                  </div>
                  <div className="font-mono text-xs text-white bg-[#0f1118] p-2 rounded-lg border border-[#202538] flex items-center justify-between">
                    <span className="truncate">{prodUrl}</span>
                    <button 
                      onClick={() => handleCopy(prodUrl, 'prodUrl')}
                      className="text-gray-400 hover:text-emerald-300 p-1 transition-colors"
                      title="Copy URL"
                    >
                      {copiedKey === 'prodUrl' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="p-4 rounded-xl bg-[#151824] border border-[#252a3d] space-y-3">
                <h5 className="font-semibold text-white text-xs uppercase tracking-wider text-gray-400">
                  Installation Steps on Samsung Galaxy S25 Ultra:
                </h5>
                <ol className="text-xs text-gray-300 space-y-2.5 list-decimal list-inside leading-relaxed">
                  <li>Ensure your Samsung S25 Ultra is connected to the same Wi-Fi network as this PC.</li>
                  <li>
                    Open <strong className="text-white">Samsung Internet</strong> or <strong className="text-white">Google Chrome</strong> on your phone.
                  </li>
                  <li>
                    Navigate to <code className="bg-[#10121a] px-1.5 py-0.5 rounded font-mono text-cyan-300">{devUrl}</code> or <code className="bg-[#10121a] px-1.5 py-0.5 rounded font-mono text-emerald-300">{prodUrl}</code>.
                  </li>
                  <li>
                    Tap the <strong className="text-cyan-300">"Install Om Knowledge OS"</strong> prompt at the bottom of the screen, or tap Menu (<strong className="text-white">⋮</strong>) &rarr; <strong className="text-white">"Install App"</strong> / <strong className="text-white">"Add to Home Screen"</strong>.
                  </li>
                  <li>
                    The Android WebAPK service compiles a native package with Sanskrit Om icon (<strong className="text-indigo-300">ॐ</strong>), standalone edge-to-edge window, and offline service worker caching.
                  </li>
                </ol>
              </div>

              {/* S25 Hardware Perks */}
              <div className="p-3.5 rounded-xl bg-[#11131c] border border-[#202436] flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-cyan-400" />
                  <span>S25 Ultra Features: 120Hz ProMotion AMOLED, Zero Address Bar, Standalone Display</span>
                </div>
                <span className="text-cyan-300 font-mono text-[11px]">100% Offline Dexie</span>
              </div>
            </div>
          )}

          {/* TAB 2: Wireless ADB Debugging */}
          {activeTab === 'adb' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Terminal size={15} className="text-indigo-400" />
                  Android Debug Bridge (ADB) Wireless Connectivity
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Connect your Samsung S25 Ultra via Wi-Fi ADB. Reverse port forwarding enables your phone to navigate to <code className="text-cyan-300">http://localhost:5173</code> directly on device without LAN routing!
                </p>
              </div>

              {/* Script Command */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Run Wireless Deployment Script (PowerShell):</span>
                  <button 
                    onClick={() => handleCopy('npm run deploy:s25', 'deployScript')}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {copiedKey === 'deployScript' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'deployScript' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-[#0b0c12] border border-[#222638] p-3 rounded-xl font-mono text-xs text-indigo-300 overflow-x-auto">
npm run deploy:s25
                </pre>
              </div>

              {/* Reverse Port Forwarding Commands */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Manual ADB Reverse Port Forwarding:</span>
                  <button 
                    onClick={() => handleCopy('adb reverse tcp:5173 tcp:5173 && adb reverse tcp:8080 tcp:8080', 'reverseCmd')}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {copiedKey === 'reverseCmd' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'reverseCmd' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-[#0b0c12] border border-[#222638] p-3 rounded-xl font-mono text-xs text-gray-300 overflow-x-auto">
adb reverse tcp:5173 tcp:5173
adb reverse tcp:8080 tcp:8080
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-[#151824] border border-[#252a3d] space-y-2 text-xs text-gray-300">
                <h5 className="font-semibold text-white">How to Enable Wireless Debugging on Samsung S25:</h5>
                <ol className="list-decimal list-inside space-y-1 text-gray-400">
                  <li>Open phone <strong>Settings &rarr; Developer Options &rarr; Wireless Debugging</strong>.</li>
                  <li>Toggle Wireless Debugging <strong>ON</strong> and tap <strong>"Pair device with pairing code"</strong>.</li>
                  <li>Run: <code className="text-indigo-300 font-mono">adb pair &lt;IP&gt;:&lt;PairingPort&gt; &lt;Code&gt;</code></li>
                  <li>Run: <code className="text-indigo-300 font-mono">adb connect &lt;IP&gt;:&lt;ConnectPort&gt;</code></li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Self-Hosted Static Server */}
          {activeTab === 'static' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-2">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Server size={15} className="text-emerald-400" />
                  Zero-Dependency Node.js Production Server
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Serve the optimized production bundle directly using the built-in HTTP server (`scripts/serve_production.mjs`). No external web server, nginx, or docker required.
                </p>
              </div>

              {/* Quick Launch Box */}
              <div className="p-4 rounded-xl bg-[#161a27] border border-[#262c40] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white text-xs">Windows 1-Click Double-Click Launcher:</span>
                    <p className="text-[11px] text-gray-400">Run from file explorer without typing any commands</p>
                  </div>
                  <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    start_production_server.cmd
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Terminal Launch Command:</span>
                  <button 
                    onClick={() => handleCopy('npm run serve', 'serveCmd')}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {copiedKey === 'serveCmd' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'serveCmd' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-[#0b0c12] border border-[#222638] p-3 rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto">
npm run serve -- --port 8080
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-[#11131c] border border-[#202436] space-y-2 text-xs">
                <span className="font-semibold text-white">Features Included:</span>
                <ul className="grid grid-cols-2 gap-2 text-gray-400">
                  <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400" /> SPA index.html fallback</li>
                  <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400" /> 1-year immutable caching</li>
                  <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400" /> Instant service worker update</li>
                  <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400" /> Auto LAN IP discovery</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: Capacitor Native Project */}
          {activeTab === 'capacitor' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-2">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Layers size={15} className="text-purple-400" />
                  Capacitor 8.5.3 Native Android Codebase
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  The complete native Gradle project has been initialized at <code className="text-purple-300">android/</code> with camera, network, and hardware acceleration permissions configured.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#171a26] rounded-xl border border-[#282d42]">
                  <span className="text-gray-400 block mb-1">Android Package ID</span>
                  <span className="font-mono text-white">com.omknowledge.os</span>
                </div>
                <div className="p-3 bg-[#171a26] rounded-xl border border-[#282d42]">
                  <span className="text-gray-400 block mb-1">Capacitor Version</span>
                  <span className="font-mono text-white">v8.5.3 (Latest)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Sync Web Assets to Native Android:</span>
                  <button 
                    onClick={() => handleCopy('npm run cap:sync', 'capSyncCmd')}
                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {copiedKey === 'capSyncCmd' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'capSyncCmd' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-[#0b0c12] border border-[#222638] p-3 rounded-xl font-mono text-xs text-purple-300 overflow-x-auto">
npm run cap:sync
                </pre>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Open in Android Studio (to compile signed APK):</span>
                  <button 
                    onClick={() => handleCopy('npm run cap:open', 'capOpenCmd')}
                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {copiedKey === 'capOpenCmd' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'capOpenCmd' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-[#0b0c12] border border-[#222638] p-3 rounded-xl font-mono text-xs text-purple-300 overflow-x-auto">
npm run cap:open
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#222638] bg-[#0f1118] flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Wifi size={14} className="text-cyan-400" />
            <span>Wi-Fi IP: <strong className="text-white font-mono">{localIp}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#202538] hover:bg-[#282f47] text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
