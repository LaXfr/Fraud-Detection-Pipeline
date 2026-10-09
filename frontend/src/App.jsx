import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldAlert,
  Users,
  Zap,
  Clock,
  Search,
  RefreshCw,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/anomalies';
const POLL_INTERVAL_SECONDS = 5;

export default function App() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [countdown, setCountdown] = useState(POLL_INTERVAL_SECONDS);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAnomalies = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setAnomalies(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch anomalies:', err);
      setError(err.message || 'Unable to connect to FastAPI backend');
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  // Polling & Countdown Loop
  useEffect(() => {
    fetchAnomalies();

    const intervalTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchAnomalies();
          return POLL_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [fetchAnomalies]);

  const handleManualRefresh = () => {
    fetchAnomalies(true);
    setCountdown(POLL_INTERVAL_SECONDS);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = anomalies.length;
    const uniqueUsers = new Set(anomalies.map((a) => a.user_id)).size;
    const peakVelocity = anomalies.reduce(
      (max, a) => Math.max(max, a.click_count || 0),
      0
    );
    return { total, uniqueUsers, peakVelocity };
  }, [anomalies]);

  // Filtered anomalies by search query (user_id)
  const filteredAnomalies = useMemo(() => {
    if (!searchQuery.trim()) return anomalies;
    const q = searchQuery.toLowerCase().trim();
    return anomalies.filter((item) =>
      item.user_id?.toLowerCase().includes(q)
    );
  }, [anomalies, searchQuery]);

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '--';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return isoStr;
    }
  };

  const formatFullDate = (isoStr) => {
    if (!isoStr) return '--';
    try {
      const d = new Date(isoStr);
      return d.toISOString().split('T')[0];
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-500/20 selection:text-rose-200">
      {/* Background radial gradient accent */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))]" />

      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/10 border border-rose-500/30 text-rose-400 shadow-sm shadow-rose-950/50">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs uppercase tracking-widest text-rose-400 font-bold">
                  FRAUD SENTINEL
                </span>
                <span className="text-zinc-600 font-mono text-xs">//</span>
                <span className="text-zinc-400 text-xs font-medium">REAL-TIME ANALYTICS</span>
              </div>
              <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                Distributed Clickstream Threat Detection
              </h1>
            </div>
          </div>

          {/* Right Status Controls */}
          <div className="flex items-center space-x-3 self-end md:self-auto">
            {/* Live Radar Pulse Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-xs font-semibold text-emerald-400 tracking-wide">
                STREAM LIVE
              </span>
            </div>

            {/* Countdown Badge */}
            <div className="px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Sync: <span className="text-zinc-200 font-bold">{countdown}s</span></span>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 active:scale-95 border border-zinc-700/60 text-zinc-300 hover:text-zinc-100 transition-all disabled:opacity-50 cursor-pointer"
              title="Trigger instant refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        
        {/* Error Notification Banner */}
        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-rose-300">Connection Error to FastAPI Backend</p>
              <p className="text-rose-200/80 mt-0.5">
                {error}. Make sure your FastAPI backend is running via{' '}
                <code className="bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50 font-mono text-xs text-rose-200">
                  uvicorn main:app --reload --port 8000
                </code>.
              </p>
            </div>
          </div>
        )}

        {/* 4 KPI Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Anomalies */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm shadow-sm transition hover:border-zinc-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-400">
                Total Anomalies
              </span>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-100 font-mono">
                {loading ? '--' : stats.total}
              </span>
              <span className="text-xs text-rose-400/80 font-mono font-medium">windowed</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Exceeding velocity threshold (&ge; 5 clicks)</p>
          </div>

          {/* Card 2: High-Risk Users */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm shadow-sm transition hover:border-zinc-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-400">
                Flagged Users
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-100 font-mono">
                {loading ? '--' : stats.uniqueUsers}
              </span>
              <span className="text-xs text-amber-400/80 font-mono font-medium">unique</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Distinct accounts breaching limits</p>
          </div>

          {/* Card 3: Peak Velocity */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm shadow-sm transition hover:border-zinc-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-400">
                Peak Velocity
              </span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-100 font-mono">
                {loading ? '--' : stats.peakVelocity}
              </span>
              <span className="text-xs text-cyan-400/80 font-mono font-medium">clicks/min</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Highest single-window burst</p>
          </div>

          {/* Card 4: Active Window Duration */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm shadow-sm transition hover:border-zinc-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-400">
                Window Duration
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-100 font-mono">
                1m
              </span>
              <span className="text-xs text-emerald-400/80 font-mono font-medium">Tumbling</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">PySpark Structured Streaming</p>
          </div>
        </section>

        {/* Toolbar: Search & Counters */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter by User ID (e.g. U114, U69)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950/80 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 font-mono cursor-pointer"
              >
                CLEAR
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono text-zinc-400">
            <span>
              Showing <span className="text-zinc-100 font-semibold">{filteredAnomalies.length}</span> of{' '}
              <span className="text-zinc-100 font-semibold">{anomalies.length}</span> records
            </span>
            {lastUpdated && (
              <span className="hidden md:inline text-zinc-600">
                • Last sync: {formatTimestamp(lastUpdated)}
              </span>
            )}
          </div>
        </section>

        {/* Polished Data Grid / Table */}
        <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/90 bg-zinc-900/90 text-zinc-400 font-mono text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-6 font-semibold">User Identity</th>
                  <th className="py-3.5 px-6 font-semibold">Window Start</th>
                  <th className="py-3.5 px-6 font-semibold">Window End</th>
                  <th className="py-3.5 px-6 font-semibold text-center">Velocity (Clicks)</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-sm">
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-6">
                        <div className="h-5 w-24 bg-zinc-800/80 rounded"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-4 w-32 bg-zinc-800/60 rounded"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-4 w-32 bg-zinc-800/60 rounded"></div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="h-6 w-12 bg-zinc-800/60 rounded-full mx-auto"></div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="h-6 w-20 bg-zinc-800/60 rounded-full ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredAnomalies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <div className="p-3 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 mb-3">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500/80" />
                        </div>
                        <h3 className="text-zinc-200 font-semibold text-base">
                          {searchQuery ? 'No Matching Records' : 'No Anomalies Detected Yet'}
                        </h3>
                        <p className="text-zinc-500 text-xs mt-1">
                          {searchQuery
                            ? `No events found for user query "${searchQuery}".`
                            : 'PySpark will push new anomalous windows (>= 5 clicks) as the 1-minute tumbling windows elapse.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAnomalies.map((item, index) => {
                    const isHighSeverity = item.click_count >= 10;
                    return (
                      <tr
                        key={`${item.user_id}-${item.window_start}-${index}`}
                        className="transition hover:bg-zinc-800/30 group"
                      >
                        {/* User ID */}
                        <td className="py-3.5 px-6 font-mono font-medium text-zinc-200">
                          <div className="flex items-center space-x-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-rose-500/60"></span>
                            <span className="group-hover:text-rose-400 transition-colors">
                              {item.user_id}
                            </span>
                          </div>
                        </td>

                        {/* Window Start */}
                        <td className="py-3.5 px-6 font-mono text-zinc-400 text-xs">
                          <div>{formatTimestamp(item.window_start)}</div>
                          <div className="text-[10px] text-zinc-600">{formatFullDate(item.window_start)}</div>
                        </td>

                        {/* Window End */}
                        <td className="py-3.5 px-6 font-mono text-zinc-400 text-xs">
                          <div>{formatTimestamp(item.window_end)}</div>
                          <div className="text-[10px] text-zinc-600">{formatFullDate(item.window_end)}</div>
                        </td>

                        {/* Click Count */}
                        <td className="py-3.5 px-6 text-center font-mono font-bold text-zinc-100">
                          {item.click_count}
                        </td>

                        {/* Dynamic Severity Pill */}
                        <td className="py-3.5 px-6 text-right">
                          {isHighSeverity ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-950/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5 animate-pulse"></span>
                              CRITICAL
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
                              WARNING
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950/80 py-4 text-center text-xs font-mono text-zinc-600">
        FRAUD SENTINEL PIPELINE • KAFKA &rarr; PYSPARK &rarr; POSTGRESQL &rarr; FASTAPI &rarr; REACT
      </footer>
    </div>
  );
}
