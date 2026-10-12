'use client';

import { useState, useEffect, useCallback } from 'react';

interface HealthData {
  status: string;
  version: string;
  timestamp: string;
  database: {
    status: string;
    timestamp?: string;
    error?: string;
  };
}

export default function Home() {
  const defaultApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const [activeUrl, setActiveUrl] = useState<string>(defaultApiUrl);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [connectionNote, setConnectionNote] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    setConnectionNote(null);
    const startTime = performance.now();

    try {
      // First attempt with configured URL
      let targetUrl = defaultApiUrl;
      let response: Response;
      
      try {
        response = await fetch(`${targetUrl}/health`, { cache: 'no-store' });
        if (!response.ok && targetUrl.includes('localhost')) {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (firstErr) {
        // If localhost failed (common on macOS due to AirPlay Receiver on port 5000), try 127.0.0.1
        if (targetUrl.includes('localhost')) {
          const fallbackUrl = targetUrl.replace('localhost', '127.0.0.1');
          response = await fetch(`${fallbackUrl}/health`, { cache: 'no-store' });
          targetUrl = fallbackUrl;
          setConnectionNote('Connected via 127.0.0.1 (macOS AirPlay port 5000 fallback)');
        } else {
          throw firstErr;
        }
      }

      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setActiveUrl(targetUrl);

      const data = await response.json();
      setHealth(data);

      if (!response.ok) {
        setError(`Backend returned HTTP ${response.status}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reach backend';
      setError(errorMsg);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, [defaultApiUrl]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header / Brand */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium tracking-wide">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Danodia FreightOS — Phase 1 Project Initialization
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Shipment Manager
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            Global logistics platform foundation. This phase establishes the Next.js frontend,
            Express REST backend, and direct PostgreSQL database connectivity.
          </p>
        </header>

        {/* Live Connectivity Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Frontend Status Card */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-200">Frontend Status</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                ONLINE
              </span>
            </div>
            
            <dl className="text-sm space-y-2.5 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <dt className="text-slate-500">Framework</dt>
                <dd className="font-mono text-slate-200">Next.js (App Router)</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <dt className="text-slate-500">Language</dt>
                <dd className="font-mono text-slate-200">TypeScript</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <dt className="text-slate-500">Styling</dt>
                <dd className="font-mono text-slate-200">Tailwind CSS</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <dt className="text-slate-500">Configured API URL</dt>
                <dd className="font-mono text-xs text-blue-400 truncate max-w-[200px]" title={defaultApiUrl}>
                  {defaultApiUrl}
                </dd>
              </div>
            </dl>
          </section>

          {/* Backend & DB Health Card */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-200">Backend & PostgreSQL</h2>
              {loading ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-spin"></span>
                  CHECKING
                </span>
              ) : health?.status === 'healthy' && health.database.status === 'connected' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  CONNECTED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  DEGRADED
                </span>
              )}
            </div>

            <dl className="text-sm space-y-2.5 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <dt className="text-slate-500">Express API</dt>
                <dd className="font-mono text-slate-200">
                  {loading ? 'Checking...' : health?.status || 'Offline'}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <dt className="text-slate-500">PostgreSQL Status</dt>
                <dd className="font-mono text-slate-200">
                  {loading ? 'Checking...' : health?.database?.status || 'Disconnected'}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <dt className="text-slate-500">Database Name</dt>
                <dd className="font-mono text-slate-200">shipment_manager</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <dt className="text-slate-500">Response Latency</dt>
                <dd className="font-mono text-slate-200">
                  {latency !== null ? `${latency} ms` : '—'}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Action & Raw Response Panel */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Health Check Integration</h3>
              <p className="text-xs text-slate-400">
                Endpoint tested: <code className="text-blue-400 font-mono">{activeUrl}/health</code>
              </p>
              {connectionNote && (
                <p className="text-xs text-amber-400/90 mt-1">
                  ℹ️ {connectionNote}
                </p>
              )}
            </div>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white transition-colors shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              {loading ? 'Testing...' : 'Test API Connection'}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {health && (
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-slate-500">Response Payload:</span>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-emerald-400 overflow-x-auto">
                {JSON.stringify(health, null, 2)}
              </pre>
            </div>
          )}
        </section>

        {/* Phase Scope Confirmation */}
        <footer className="text-center text-xs text-slate-500 pt-4 border-t border-slate-800/60">
          <p>Phase 1 Foundation Complete — Ready for Phase 2: JWT Authentication</p>
        </footer>

      </div>
    </main>
  );
}
