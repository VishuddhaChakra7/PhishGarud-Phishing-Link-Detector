import React, { useState } from 'react';
import { ScanInput } from '../components/scanner/ScanInput';
import { LoadingStream } from '../components/scanner/LoadingStream';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Inspect: React.FC = () => {
  const [emailResults, setEmailResults] = useState<any | null>(null);

  const features = [
    {
      title: 'Optuna + XGBoost Ensemble',
      desc: '30 lexical attributes evaluated in parallel. The pipeline balances inputs via SMOTE and adjusts prediction probabilities against sandbox results.'
    },
    {
      title: 'SHAP Interpretability',
      desc: 'Isolates and visualizes game-theoretic feature weights, ensuring predictions are transparent, verifiable, and fully explainable.'
    },
    {
      title: 'Telemetry Sandbox SSE',
      desc: 'Progressive sandbox jobs check SSL chains, WHOIS registrars, HTTP hops, and Levenshtein edit distance, streaming live to your dashboard.'
    }
  ];

  return (
    <div className="w-full min-h-screen pt-24 pb-16 px-8 relative">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* Editorial Heading */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-normal tracking-tight text-text-primary">
            Threat Intelligence <span className="editorial-title">Forensics</span>
          </h1>
          <p className="text-xs text-text-secondary font-mono uppercase tracking-wider max-w-xl mx-auto leading-relaxed">
            real-time explainable phishing link classifier & sandbox telemetry
          </p>
        </div>

        {/* Input Panel */}
        <div>
          <ScanInput onEmailScanComplete={(data) => setEmailResults(data)} />
        </div>

        {/* Dynamic Loading Stream */}
        <LoadingStream />

        {/* Email Extraction Table */}
        {emailResults && (
          <div className="w-full bg-card border border-border-card rounded-lg p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 border-b border-border-card pb-4">
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest font-mono mb-1">
                  Extracted Links Report
                </h3>
                <p className="text-[10px] text-text-muted">
                  Found {emailResults.total_links_found} unique links inside email block.
                </p>
              </div>
              <div className="flex gap-4 text-[10px] font-mono">
                <span className="text-safe-green font-semibold">SAFE: {emailResults.safe_count}</span>
                <span className="text-phish-red font-semibold">PHISHING: {emailResults.phishing_count}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-border-card text-text-muted uppercase tracking-wider font-semibold">
                    <th className="pb-3">URL</th>
                    <th className="pb-3">Verdict</th>
                    <th className="pb-3">Threat Proba</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-card text-text-secondary">
                  {emailResults.scans.map((scan: any) => (
                    <tr key={scan.scan_id} className="hover:bg-card-elevated/40">
                      <td className="py-3.5 max-w-xs truncate" title={scan.url}>
                        {scan.url}
                      </td>
                      <td className="py-3.5">
                        <span className={`font-bold uppercase text-[9px] px-1.5 py-0.5 border rounded ${
                          scan.verdict === 'PHISHING' 
                            ? 'text-phish-red border-phish-red/20 bg-phish-red/5' 
                            : scan.verdict === 'SUSPICIOUS'
                            ? 'text-suspicious-amber border-suspicious-amber/20 bg-suspicious-amber/5'
                            : 'text-safe-green border-safe-green/20 bg-safe-green/5'
                        }`}>
                          {scan.verdict}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {Math.round(scan.confidence * 100)}%
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          to={`/results/${scan.scan_id}`}
                          className="text-accent-blue hover:underline inline-flex items-center gap-1"
                        >
                          <span>Audit</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Minimal Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border-card">
          {features.map((f, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
                {f.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
