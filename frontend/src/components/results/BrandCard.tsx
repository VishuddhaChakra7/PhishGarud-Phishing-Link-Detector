import { Fingerprint, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BrandCardProps {
  brand: any;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  const isAvailable = brand && brand.best_match !== undefined;
  
  if (!isAvailable) return null;

  const isSuspicious = brand.is_suspicious;
  const bestMatch = brand.best_match;
  const distance = brand.distance;

  return (
    <div className={`w-full bg-card border border-border-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${
      isSuspicious ? 'shadow-[0_0_30px_rgba(245,158,11,0.08)] border-suspicious-amber/10' : ''
    }`}>
      <div className="flex items-center gap-2 mb-4 border-b border-border-card pb-3">
        <Fingerprint className="w-5 h-5 text-accent-blue" />
        <h3 className="text-base font-semibold text-text-primary font-sans">
          Brand Similarity & Typosquatting Analysis
        </h3>
      </div>

      {isSuspicious ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-suspicious-amber/10 border border-suspicious-amber/20 p-4 rounded-xl">
            <AlertCircle className="w-5 h-5 text-suspicious-amber shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-suspicious-amber mb-1">
                Typosquatting Mimicry Warning
              </p>
              <p className="text-xs text-text-secondary">
                The domain utilizes visual similarities or homoglyphs targeting the registered brand <span className="font-bold text-text-primary">'{bestMatch}'</span>. The Levenshtein edit distance is only <span className="font-bold text-text-primary">{distance}</span> character changes, which is a key signature of deceptive phishing templates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-card-elevated border border-border-card p-3.5 rounded-xl">
              <span className="text-text-muted block text-[10px] uppercase font-semibold tracking-wider mb-1">
                Impersonated Target
              </span>
              <span className="text-text-primary font-bold">{bestMatch}</span>
            </div>
            <div className="bg-card-elevated border border-border-card p-3.5 rounded-xl">
              <span className="text-text-muted block text-[10px] uppercase font-semibold tracking-wider mb-1">
                Character Distance
              </span>
              <span className="text-phish-red font-bold">{distance} char diff</span>
            </div>
          </div>
        </div>
      ) : distance === 0 ? (
        <div className="flex items-start gap-3 bg-safe-green/10 border border-safe-green/20 p-4 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-safe-green shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-safe-green mb-1">
              Official Brand Domain Match
            </p>
            <p className="text-xs text-text-secondary">
              This domain is a confirmed matches of the official domain listed for brand target <span className="font-bold text-text-primary">'{bestMatch}'</span>.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-card-elevated border border-border-card p-4 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-text-primary mb-1">
              No Typosquatting Indicators
            </p>
            <p className="text-xs text-text-secondary">
              The domain does not fall into visual edit proximity with standard targeting lists of high-profile financial or corporate brands.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
