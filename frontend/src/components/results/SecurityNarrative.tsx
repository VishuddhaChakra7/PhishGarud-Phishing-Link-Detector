import React from 'react';

interface SecurityNarrativeProps {
  tips: {
    findings: string;
    attack_pattern: string;
    recommendation: string;
  };
}

export const SecurityNarrative: React.FC<SecurityNarrativeProps> = ({ tips }) => {
  if (!tips) return null;

  return (
    <div className="w-full bg-card border border-border-card rounded-lg p-6 space-y-6">
      <div className="border-b border-border-card pb-3">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest font-mono">
          Forensics Classification
        </h3>
      </div>

      <div className="space-y-5">
        {/* Section 1: Findings */}
        <div>
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block mb-1.5 font-mono">
            Observations
          </span>
          <p className="text-xs text-text-secondary leading-relaxed font-sans">
            {tips.findings || "No anomalous characteristics were found in the URL syntax or registry files."}
          </p>
        </div>

        {/* Section 2: Attack Classification */}
        <div>
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block mb-1.5 font-mono">
            Attack Classification
          </span>
          <p className="text-xs text-text-secondary leading-relaxed font-sans">
            {tips.attack_pattern || "Legitimate Profile: The domain does not align with active threat delivery structures."}
          </p>
        </div>

        {/* Section 3: Recommendations */}
        <div>
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block mb-1.5 font-mono">
            Mitigation Playbook
          </span>
          <div className="text-xs text-text-secondary leading-relaxed space-y-2.5 font-sans">
            {tips.recommendation ? (
              tips.recommendation.split('. ').map((rec, i) => {
                if (!rec.trim()) return null;
                return (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-text-muted shrink-0 mt-1 text-[9px] font-mono">●</span>
                    <span>{rec.trim()}{rec.trim().endsWith('.') ? '' : '.'}</span>
                  </div>
                );
              })
            ) : (
              <div className="flex gap-2 items-start">
                <span className="text-safe-green shrink-0 mt-0.5">•</span>
                <span>The link behaves cleanly. No precautionary overrides are needed.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
