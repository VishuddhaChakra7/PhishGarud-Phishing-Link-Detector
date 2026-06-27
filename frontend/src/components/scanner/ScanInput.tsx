import React, { useState } from 'react';
import { useScanStream } from '../../hooks/useScanStream';
import { postScan, postEmailScan } from '../../lib/api';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScanInputProps {
  onEmailScanComplete?: (data: any) => void;
}

export const ScanInput: React.FC<ScanInputProps> = ({ onEmailScanComplete }) => {
  const navigate = useNavigate();
  const { initiateScan } = useScanStream();
  
  const [mode, setMode] = useState<'URL' | 'EMAIL'>('URL');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (mode === 'URL') {
        const res = await postScan(inputValue);
        initiateScan(res.scan_id);
      } else {
        const res = await postEmailScan(inputValue);
        if (onEmailScanComplete) {
          onEmailScanComplete(res);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Scan execution failed.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Editorial Mode Selectors */}
      <div className="flex gap-6 mb-3 px-1">
        <button
          type="button"
          onClick={() => { setMode('URL'); setError(null); }}
          className={`text-xs font-mono pb-1 border-b ${
            mode === 'URL' ? 'border-text-primary text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          Single Link
        </button>
        <button
          type="button"
          onClick={() => { setMode('EMAIL'); setError(null); }}
          className={`text-xs font-mono pb-1 border-b ${
            mode === 'EMAIL' ? 'border-text-primary text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          Email Extractor
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border-card rounded-lg p-2.5 flex items-center gap-3">
        {mode === 'URL' ? (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Inspect target domain (e.g. login-secure-paypal.com)..."
            disabled={loading}
            className="flex-1 bg-transparent border-0 outline-none text-xs text-text-primary placeholder:text-text-muted font-mono px-2 py-1.5"
          />
        ) : (
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Paste raw email content to extract and batch scan links..."
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent border-0 outline-none text-xs text-text-primary placeholder:text-text-muted font-mono px-2 py-1.5 resize-none h-8"
          />
        )}

        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="bg-text-primary hover:bg-zinc-200 disabled:bg-card-elevated disabled:text-text-muted text-page text-xs font-semibold py-1.5 px-4 rounded transition-colors font-mono uppercase tracking-wider shrink-0"
        >
          {loading ? '...' : 'scan'}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 mt-4 bg-phish-red/5 border border-phish-red/20 text-phish-red p-3 rounded-lg text-xs font-mono">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Spreadsheet link */}
      <div className="mt-4 text-center">
        <button
          onClick={() => navigate('/bulk')}
          className="text-[11px] font-mono text-text-muted hover:text-text-secondary hover:underline"
        >
          → Or upload spreadsheet (CSV)
        </button>
      </div>
    </div>
  );
};
