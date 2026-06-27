import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface VerdictBannerProps {
  url: string;
  verdict: string;
  confidence: number;
  phishtankOverride: boolean;
}

export const VerdictBanner: React.FC<VerdictBannerProps> = ({
  url,
  verdict,
  confidence,
  phishtankOverride
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getVerdictStyles = () => {
    switch (verdict.toUpperCase()) {
      case 'PHISHING':
        return {
          border: 'border-phish-red/30',
          text: 'text-phish-red',
          bgBadge: 'bg-phish-red/10 border-phish-red/20',
          label: 'Phishing Threat Flagged'
        };
      case 'SUSPICIOUS':
        return {
          border: 'border-suspicious-amber/30',
          text: 'text-suspicious-amber',
          bgBadge: 'bg-suspicious-amber/10 border-suspicious-amber/20',
          label: 'Suspicious Heuristics Flagged'
        };
      default:
        return {
          border: 'border-safe-green/30',
          text: 'text-safe-green',
          bgBadge: 'bg-safe-green/10 border-safe-green/20',
          label: 'Legitimate Connection Profile'
        };
    }
  };

  const styles = getVerdictStyles();

  return (
    <div className={`w-full border rounded-lg p-6 bg-card-elevated ${styles.border} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-text-primary">
            {styles.label}
          </h2>
          {phishtankOverride && (
            <span className="bg-phish-red/10 text-phish-red border border-phish-red/25 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono">
              verified threat database
            </span>
          )}
        </div>
        
        {/* Monospace URL display */}
        <div className="flex items-center gap-2 border-b border-border-card pb-1.5 max-w-[280px] md:max-w-xl">
          <span className="font-mono text-xs text-text-secondary truncate select-all">
            {url}
          </span>
          <button 
            onClick={handleCopy} 
            className="text-text-muted hover:text-text-primary shrink-0 transition-colors"
            title="Copy URL"
          >
            {copied ? <Check className="w-3 h-3 text-safe-green" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Numerical score block */}
      <div className="flex flex-col md:items-end justify-center shrink-0">
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-0.5">
          threat score
        </span>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold font-mono tracking-tighter ${styles.text}`}>
            {(confidence * 100).toFixed(1)}%
          </span>
          <span className="text-text-secondary text-[11px] font-mono">risk</span>
        </div>
      </div>
    </div>
  );
};
