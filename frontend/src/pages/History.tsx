import React, { useEffect, useState } from 'react';
import { getHistory } from '../lib/api';
import { Search, ChevronLeft, ChevronRight, History as HistoryIcon, Clock, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const History: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [verdictFilter, setVerdictFilter] = useState<'ALL' | 'SAFE' | 'SUSPICIOUS' | 'PHISHING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page to 1 on new search
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await getHistory(page, 15, verdictFilter, debouncedSearch);
        setItems(res.items);
        setTotalPages(res.pages);
        setTotalItems(res.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page, verdictFilter, debouncedSearch]);

  const getVerdictIcon = (verdict: string) => {
    switch (verdict.toUpperCase()) {
      case 'PHISHING':
        return <ShieldAlert className="w-3.5 h-3.5 text-phish-red" />;
      case 'SUSPICIOUS':
        return <AlertTriangle className="w-3.5 h-3.5 text-suspicious-amber" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-safe-green" />;
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict.toUpperCase()) {
      case 'PHISHING':
        return 'text-phish-red bg-phish-red/10 border-phish-red/20';
      case 'SUSPICIOUS':
        return 'text-suspicious-amber bg-suspicious-amber/10 border-suspicious-amber/20';
      default:
        return 'text-safe-green bg-safe-green/10 border-safe-green/20';
    }
  };

  return (
    <div className="w-full min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-card pb-5">
          <div className="flex items-center gap-2.5">
            <HistoryIcon className="w-6 h-6 text-accent-blue" />
            <div>
              <h1 className="text-xl font-bold text-text-primary font-sans">
                Threat Audit Logging History
              </h1>
              <p className="text-xs text-text-secondary">
                Search and analyze past scanned threat indexes. Total cached scans: {totalItems}.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search URLs..."
              className="w-full bg-card border border-border-card rounded-xl py-2 pl-10 pr-4 text-xs text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted font-mono"
            />
          </div>
        </div>

        {/* Filters and Paginations */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Verdict tabs */}
          <div className="flex bg-card border border-border-card rounded-xl p-1">
            {(['ALL', 'SAFE', 'SUSPICIOUS', 'PHISHING'] as const).map((v) => (
              <button
                key={v}
                onClick={() => { setVerdictFilter(v); setPage(1); }}
                className={`py-1.5 px-4 rounded-lg font-semibold transition-colors ${
                  verdictFilter === v
                    ? 'bg-card-elevated text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Pagination controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 bg-card border border-border-card hover:bg-card-elevated disabled:opacity-30 rounded-xl transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-text-secondary" />
            </button>
            <span className="font-mono text-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 bg-card border border-border-card hover:bg-card-elevated disabled:opacity-30 rounded-xl transition-all"
            >
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* History Table Container */}
        <div className="bg-card border border-border-card rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] font-mono text-text-secondary">Querying Database Logs...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-text-secondary">
              No matching records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-card bg-page/30 text-text-muted uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-6">Domain / URL</th>
                    <th className="py-3.5 px-6">Verdict</th>
                    <th className="py-3.5 px-6">Threat Probability</th>
                    <th className="py-3.5 px-6">Domain Age</th>
                    <th className="py-3.5 px-6">Scanned At</th>
                    <th className="py-3.5 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-card">
                  {items.map((item) => (
                    <tr key={item.scan_id} className="hover:bg-card-elevated/40 transition-colors">
                      <td className="py-4 px-6 max-w-xs md:max-w-sm truncate">
                        <span className="font-sans font-semibold text-text-primary block mb-0.5">
                          {item.domain}
                        </span>
                        <span className="font-mono text-[10px] text-text-muted block truncate" title={item.url}>
                          {item.url}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 font-bold uppercase text-[9px] font-mono tracking-wider px-2 py-0.5 border rounded-md ${getVerdictBadge(item.verdict)}`}>
                          {getVerdictIcon(item.verdict)}
                          <span>{item.verdict}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-text-secondary font-bold">
                        {Math.round(item.confidence * 100)}%
                      </td>
                      <td className="py-4 px-6">
                        <span className="flex items-center gap-1 text-text-secondary font-mono">
                          <Clock className="w-3.5 h-3.5 text-text-muted" />
                          {item.domain_age === -1 ? 'Unknown' : `${item.domain_age}d`}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-text-muted font-mono">
                        {item.scanned_at ? item.scanned_at.split('T')[0] : 'Unknown'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/results/${item.scan_id}`}
                          className="bg-card-elevated border border-border-card hover:border-accent-blue/30 text-text-secondary hover:text-accent-blue text-xs font-semibold py-1.5 px-3.5 rounded-lg transition-all"
                        >
                          Audit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
