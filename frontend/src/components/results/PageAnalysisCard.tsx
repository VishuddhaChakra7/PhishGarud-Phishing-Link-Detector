import { AlertTriangle, ShieldAlert, Code2 } from 'lucide-react';

interface PageAnalysisCardProps {
  page: any;
}

export const PageAnalysisCard: React.FC<PageAnalysisCardProps> = ({ page }) => {
  const isAvailable = page && !page.error;

  return (
    <div className="w-full bg-card border border-border-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4 border-b border-border-card pb-3">
        <Code2 className="w-5 h-5 text-accent-blue" />
        <h3 className="text-base font-semibold text-text-primary font-sans">
          Page Structure & HTML Sandbox Scans
        </h3>
      </div>

      {!isAvailable ? (
        <div className="py-8 text-center text-text-muted text-xs">
          {page?.error || 'Page sandbox structures unavailable.'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Counters Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-card-elevated border border-border-card p-3 rounded-xl">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                Embedded Scripts
              </span>
              <span className="font-mono text-lg font-bold text-text-primary">
                {page.count_scripts}
              </span>
            </div>
            <div className="bg-card-elevated border border-border-card p-3 rounded-xl">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                Iframes (Frames)
              </span>
              <span className={`font-mono text-lg font-bold ${page.count_iframes > 0 ? 'text-phish-red' : 'text-text-primary'}`}>
                {page.count_iframes}
              </span>
            </div>
            <div className="bg-card-elevated border border-border-card p-3 rounded-xl">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                External Assets
              </span>
              <span className="font-mono text-lg font-bold text-text-primary">
                {page.count_external_resources || 0}
              </span>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3 pt-2">
            <p className="text-xs uppercase font-semibold text-text-muted tracking-wider mb-2">
              Behavioral Signatures
            </p>

            {/* Check 1: Login Form */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-card-elevated border border-border-card">
              <span className="text-text-secondary">Password Login Fields Detected</span>
              {page.has_login_form ? (
                <span className="flex items-center gap-1 text-phish-red font-bold font-mono text-[10px] uppercase bg-phish-red/10 border border-phish-red/25 px-2 py-0.5 rounded">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Warning
                </span>
              ) : (
                <span className="text-text-muted">None</span>
              )}
            </div>

            {/* Check 2: External Form Action */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-card-elevated border border-border-card">
              <span className="text-text-secondary">External Form Submission Targets</span>
              {page.form_action_is_external ? (
                <span className="flex items-center gap-1 text-phish-red font-bold font-mono text-[10px] uppercase bg-phish-red/10 border border-phish-red/25 px-2 py-0.5 rounded animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  High Risk
                </span>
              ) : (
                <span className="text-safe-green font-bold font-mono text-[10px] uppercase">Secure</span>
              )}
            </div>

            {/* Check 3: Right click disabled */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-card-elevated border border-border-card">
              <span className="text-text-secondary">Right-Click / Context Menu Locks</span>
              {page.right_click_disabled ? (
                <span className="flex items-center gap-1 text-suspicious-amber font-bold font-mono text-[10px] uppercase bg-suspicious-amber/10 border border-suspicious-amber/25 px-2 py-0.5 rounded">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Suspicious
                </span>
              ) : (
                <span className="text-text-muted">None</span>
              )}
            </div>

            {/* Check 4: Favicon spoofing */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-card-elevated border border-border-card">
              <span className="text-text-secondary">Favicon Spoofing (External Reference)</span>
              {page.has_favicon_from_external ? (
                <span className="flex items-center gap-1 text-suspicious-amber font-bold font-mono text-[10px] uppercase bg-suspicious-amber/10 border border-suspicious-amber/25 px-2 py-0.5 rounded">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Visual Spoof
                </span>
              ) : (
                <span className="text-text-muted">None</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
