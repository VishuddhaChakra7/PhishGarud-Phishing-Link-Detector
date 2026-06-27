import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileCode } from 'lucide-react';

interface FeatureTableProps {
  features: Record<string, number | string | boolean>;
}

export const FeatureTable: React.FC<FeatureTableProps> = ({ features }) => {
  const [open, setOpen] = useState(false);

  if (!features) return null;

  return (
    <div className="w-full bg-card border border-border-card rounded-2xl overflow-hidden transition-all duration-300">
      {/* Header button toggler */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 hover:bg-card-elevated transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-accent-blue" />
          <div>
            <h3 className="text-base font-semibold text-text-primary font-sans">
              Raw Lexical Feature Space Audit
            </h3>
            <p className="text-xs text-text-muted">
              Inspect the offline lexical vector (30 attributes) fed directly to the XGBoost ML model.
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
      </button>

      {open && (
        <div className="border-t border-border-card bg-page/50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(features).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between text-xs p-3 rounded-xl bg-card border border-border-card font-mono"
              >
                <span className="text-text-secondary truncate max-w-[160px]" title={key}>
                  {key}
                </span>
                <span className="text-text-primary font-bold">
                  {typeof val === 'boolean' 
                    ? (val ? 'TRUE' : 'FALSE') 
                    : typeof val === 'number' 
                    ? Number.isInteger(val) ? val : val.toFixed(4)
                    : val
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
