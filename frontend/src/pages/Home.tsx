import { Link } from 'react-router-dom';
import { ShieldCheck, Database, Fingerprint } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="w-full min-h-screen pt-28 pb-20 px-8 relative">
      <div className="max-w-4xl mx-auto space-y-24">
        
        {/* Hero Section */}
        <div className="space-y-6 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-text-primary leading-tight">
            Trust, verified <span className="editorial-title">character by character</span>.
          </h1>
          <p className="text-xs text-text-secondary font-mono uppercase tracking-wider leading-relaxed">
            an explainable threat intelligence sandbox for deceptive links
          </p>
          <p className="text-xs text-text-secondary leading-relaxed max-w-lg mx-auto">
            PhishGarud is an open-source security framework. It combines real-time lexical ML inference with live registry sandboxing, compiling structured audit trails that explain exactly why a link is dangerous.
          </p>
          
          <div className="flex justify-center gap-4 pt-4">
            <Link
              to="/inspect"
              className="bg-text-primary hover:bg-zinc-200 text-page text-xs font-semibold py-2 px-6 rounded transition-colors font-mono uppercase tracking-wider"
            >
              Start Inspecting
            </Link>
            <Link
              to="/about"
              className="border border-border-card hover:border-text-secondary text-text-primary text-xs font-semibold py-2 px-6 rounded transition-colors font-mono uppercase tracking-wider"
            >
              View Specs
            </Link>
          </div>
        </div>

        {/* Product Dashboard Mock Visual (Stark Editorial Design) */}
        <div className="border border-border-card bg-card rounded-lg p-6 space-y-6 shadow-sm">
          {/* Header Bar */}
          <div className="flex justify-between items-center border-b border-border-card pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-phish-red animate-pulse" />
              <span className="font-mono text-xs text-text-primary font-semibold uppercase tracking-wider">
                Active Threat Alert Mockup
              </span>
            </div>
            <span className="font-mono text-[9px] text-text-muted">
              SANDBOX REPORT PREVIEW
            </span>
          </div>

          {/* Verdict Banner Mock */}
          <div className="border border-phish-red/35 bg-card-elevated rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-1">
                Phishing Threat Flagged
              </h3>
              <span className="font-mono text-[10px] text-phish-red bg-phish-red/10 border border-phish-red/25 px-2 py-0.5 rounded uppercase">
                Impersonation Target: PayPal
              </span>
            </div>
            <div className="sm:text-right font-mono shrink-0">
              <span className="text-[9px] text-text-muted uppercase block">Threat Score</span>
              <span className="text-xl font-bold text-phish-red">94.8% risk</span>
            </div>
          </div>

          {/* Risk scale bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[9px] text-text-secondary">
              <span>Legitimate</span>
              <span className="text-phish-red">94.8% Severity</span>
            </div>
            <div className="relative w-full h-1.5 bg-card-elevated border border-border-card rounded-full">
              <div className="h-full bg-phish-red rounded-full" style={{ width: '94.8%' }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-text-primary border border-border-card rounded-full" style={{ left: 'calc(94.8% - 6px)' }} />
            </div>
          </div>

          {/* Core Telemetry findings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[10px] text-text-secondary pt-2">
            <div className="bg-card-elevated border border-border-card p-3 rounded-lg space-y-1">
              <span className="text-text-muted block text-[9px] uppercase font-bold">WHOIS Forensics</span>
              <span className="text-phish-red block font-semibold">Registered: 4 days ago</span>
              <span className="text-text-muted block text-[9px]">Suspicious young domain</span>
            </div>
            <div className="bg-card-elevated border border-border-card p-3 rounded-lg space-y-1">
              <span className="text-text-muted block text-[9px] uppercase font-bold">Brand Distance</span>
              <span className="text-phish-red block font-semibold">Levenshtein Edit: 1</span>
              <span className="text-text-muted block text-[9px]">Mimics 'paypal.com'</span>
            </div>
            <div className="bg-card-elevated border border-border-card p-3 rounded-lg space-y-1">
              <span className="text-text-muted block text-[9px] uppercase font-bold">HTML Sandbox</span>
              <span className="text-phish-red block font-semibold">Form Submission: External</span>
              <span className="text-text-muted block text-[9px]">Steals credentials offsite</span>
            </div>
          </div>
        </div>

        {/* Feature Columns (Breathing room, minimal) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 border-t border-border-card text-xs">
          <div className="space-y-3">
            <Fingerprint className="w-5 h-5 text-text-primary" />
            <h3 className="font-mono font-bold uppercase tracking-wider text-text-primary">
              Lexical Signal Analysis
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Fast, sub-200ms ML inspections. The pipeline extracts 30 unique lexical attributes directly from the URL query strings, entropies, and subdomain patterns.
            </p>
          </div>
          <div className="space-y-3">
            <ShieldCheck className="w-5 h-5 text-text-primary" />
            <h3 className="font-mono font-bold uppercase tracking-wider text-text-primary">
              Local Sandboxing
            </h3>
            <p className="text-text-secondary leading-relaxed">
              FastAPI launches lightweight async background tasks running parallel queries: WHOIS date lookups, SSL trust structures, and HTTP redirect crossing checks.
            </p>
          </div>
          <div className="space-y-3">
            <Database className="w-5 h-5 text-text-primary" />
            <h3 className="font-mono font-bold uppercase tracking-wider text-text-primary">
              Explainable AI (SHAP)
            </h3>
            <p className="text-text-secondary leading-relaxed">
              We compile exact SHAP vector mappings illustrating why a link is blocked. Safe and malicious weights are isolated for transparent security reviews.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
