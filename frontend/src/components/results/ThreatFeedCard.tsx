import React from 'react';
import { AlertCircle, ShieldCheck, Database, ExternalLink } from 'lucide-react';

interface ThreatFeedCardProps {
  threats: any;
}

export const ThreatFeedCard: React.FC<ThreatFeedCardProps> = ({ threats }) => {
  const isAvailable = threats && !threats.error;
  const isListed = isAvailable && (threats.is_phishing || threats.urlhaus_hit || threats.phishtank_hit || threats.openphish_hit);

  return (
    <div className={`w-full bg-card border border-border-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${
      isListed ? 'shadow-[0_0_30px_rgba(239,68,68,0.08)] border-phish-red/10' : ''
    }`}>
      <div className="flex items-center gap-2 mb-4 border-b border-border-card pb-3">
        <Database className="w-5 h-5 text-accent-blue" />
        <h3 className="text-base font-semibold text-text-primary font-sans">
          Threat Intelligence Aggregation
        </h3>
      </div>

      {!isAvailable ? (
        <div className="py-8 text-center text-text-muted text-xs">
          {threats?.error || 'Threat feeds lookup unavailable.'}
        </div>
      ) : isListed ? (
        <div className="space-y-4">
          {/* Confirmed listed container */}
          <div className="flex items-start gap-3 bg-phish-red/10 border border-phish-red/20 p-4 rounded-xl">
            <AlertCircle className="w-5 h-5 text-phish-red shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-phish-red mb-1">
                Blacklist Match Confirmed
              </p>
              <p className="text-xs text-text-secondary">
                This URL matched active malicious URL databases in real time. Cybersecurity communities have flagged this link as active phishing or malware delivery.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Feed item PhishTank */}
            <div className={`p-4 border rounded-xl flex flex-col justify-between ${
              threats.phishtank_hit || (threats.is_phishing && threats.verified)
                ? 'bg-phish-red/10 border-phish-red/20 text-phish-red'
                : 'bg-card-elevated border-border-card text-text-secondary'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold">PhishTank</span>
                {threats.phish_detail_url && (
                  <a href={threats.phish_detail_url} target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {threats.phishtank_hit || (threats.is_phishing && threats.verified) ? 'Listed' : 'Clean'}
              </span>
            </div>

            {/* Feed item URLhaus */}
            <div className={`p-4 border rounded-xl flex flex-col justify-between ${
              threats.urlhaus_hit
                ? 'bg-phish-red/10 border-phish-red/20 text-phish-red'
                : 'bg-card-elevated border-border-card text-text-secondary'
            }`}>
              <span className="text-xs font-semibold mb-1">URLhaus Malware Feed</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {threats.urlhaus_hit ? 'Listed' : 'Clean'}
              </span>
            </div>

            {/* Feed item OpenPhish */}
            <div className={`p-4 border rounded-xl flex flex-col justify-between ${
              threats.openphish_hit
                ? 'bg-phish-red/10 border-phish-red/20 text-phish-red'
                : 'bg-card-elevated border-border-card text-text-secondary'
            }`}>
              <span className="text-xs font-semibold mb-1">OpenPhish Feed</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {threats.openphish_hit ? 'Listed' : 'Clean'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-safe-green/10 border border-safe-green/20 p-4 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-safe-green shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-safe-green mb-1">
              Zero Database Matches
            </p>
            <p className="text-xs text-text-secondary">
              This link is not registered on public blacklists (PhishTank, URLhaus, OpenPhish) as an active threat.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
