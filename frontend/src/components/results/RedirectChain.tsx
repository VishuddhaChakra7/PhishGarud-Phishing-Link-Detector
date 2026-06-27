import React from 'react';
import { ArrowRight, AlertTriangle, ArrowDown } from 'lucide-react';

interface Hop {
  url: string;
  status_code: number;
}

interface RedirectChainProps {
  hops: Hop[];
  hopCount: number;
  crossesDomain: boolean;
  verdict: string;
}

export const RedirectChain: React.FC<RedirectChainProps> = ({
  hops,
  hopCount,
  crossesDomain,
  verdict
}) => {
  if (hopCount === 0 || !hops || hops.length === 0) return null;

  const extractHost = (urlStr: string) => {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname;
    } catch {
      return urlStr;
    }
  };

  const extractRegDomain = (urlStr: string) => {
    // Basic JS regex fallback if tldextract parsing is backend-only
    try {
      const host = extractHost(urlStr);
      const parts = host.split('.');
      if (parts.length > 2) {
        return parts.slice(-2).join('.');
      }
      return host;
    } catch {
      return urlStr;
    }
  };

  const getHopStyle = (hop: Hop, index: number) => {
    const isFirst = index === 0;
    const isLast = index === hops.length - 1;

    if (isFirst) {
      return 'bg-card-elevated border-border-card text-text-secondary';
    }

    if (isLast) {
      switch (verdict.toUpperCase()) {
        case 'PHISHING':
          return 'bg-phish-red/20 border-phish-red/40 text-phish-red font-medium';
        case 'SUSPICIOUS':
          return 'bg-suspicious-amber/20 border-suspicious-amber/40 text-suspicious-amber font-medium';
        default:
          return 'bg-safe-green/20 border-safe-green/40 text-safe-green font-medium';
      }
    }

    // Check if intermediate hop crosses domain boundaries from the start domain
    const startDomain = extractRegDomain(hops[0].url);
    const currentDomain = extractRegDomain(hop.url);
    
    if (startDomain !== currentDomain) {
      return 'bg-suspicious-amber/25 border-suspicious-amber/45 text-suspicious-amber font-medium';
    }

    return 'bg-card-elevated border-border-card text-text-secondary';
  };

  return (
    <div className="w-full bg-card border border-border-card rounded-2xl p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            Redirection Forensics
          </h3>
          <p className="text-xs text-text-muted">
            Analyzing redirect routing and domain transfers from source link to final page.
          </p>
        </div>

        {crossesDomain && (
          <div className="flex items-center gap-1.5 bg-suspicious-amber/10 border border-suspicious-amber/25 text-suspicious-amber text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Crosses Domains</span>
          </div>
        )}
      </div>

      {/* Horizontal chain on desktop, vertical list on mobile */}
      <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3">
        {hops.map((hop, index) => {
          const host = extractHost(hop.url);
          const isLast = index === hops.length - 1;
          const cardStyle = getHopStyle(hop, index);

          return (
            <React.Fragment key={index}>
              {/* Hop Pill */}
              <div className={`flex items-center gap-2.5 border rounded-xl p-3 md:py-2.5 md:px-4 ${cardStyle} min-w-[200px] md:min-w-0 flex-1 md:flex-none`}>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-page border border-border-card rounded-md shrink-0">
                  {hop.status_code || 200}
                </span>
                <span className="font-mono text-xs truncate max-w-[240px]" title={hop.url}>
                  {host}
                </span>
              </div>

              {/* Connector Arrow */}
              {!isLast && (
                <>
                  <div className="hidden md:flex text-text-muted select-none">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div className="flex md:hidden justify-center text-text-muted select-none py-1">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                </>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
