import { Shield, Brain, Cpu, Zap, Info } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="w-full min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="border-b border-border-card pb-5">
          <div className="flex items-center gap-2.5">
            <Info className="w-6 h-6 text-accent-blue" />
            <div>
              <h1 className="text-xl font-bold text-text-primary font-sans">
                PhishGarud Architecture Specifications
              </h1>
              <p className="text-xs text-text-secondary font-mono">
                Decoupled multi-layered threat intelligence engine & Explainable ML classification.
              </p>
            </div>
          </div>
        </div>

        {/* Introduction Section */}
        <section className="bg-card border border-border-card rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-blue" />
            <span>The PhishGarud Philosophy</span>
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Most cybersecurity scanners behave as opaque black boxes — they ingest a URL, run classification steps behind the scenes, and output a binary verdict (safe vs dangerous) along with an unexplained probability indicator.
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            PhishGarud is engineered from first principles as an explainable threat intelligence pipeline. It uses a decoupled layout separating fast lexical assessment from intensive network sandbox operations, streaming findings dynamically via Server-Sent Events (SSE) and mapping specific predictive drivers using SHAP (SHapley Additive exPlanations) values.
          </p>
        </section>

        {/* Decoupled Processing Flow Card */}
        <section className="bg-card border border-border-card rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-blue" />
            <span>Decoupled Progressive Analysis Stream</span>
          </h2>
          
          <div className="space-y-4 text-xs">
            <div className="relative border-l-2 border-border-card pl-6 ml-3 space-y-6">
              {/* Step 1 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-accent-blue/20 border border-accent-blue flex items-center justify-center text-[9px] font-bold text-accent-blue">1</span>
                <h4 className="font-semibold text-text-primary mb-1">Fast Lexical Inference (sub-200ms)</h4>
                <p className="text-text-secondary leading-relaxed">
                  Upon URL submission, our API instantly extracts 30 lexical attributes (entropies, TLD positions, word ratios) and computes an initial XGBoost classification score. This secures high-availability checks for integrations and extensions.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-accent-blue/20 border border-accent-blue flex items-center justify-center text-[9px] font-bold text-accent-blue">2</span>
                <h4 className="font-semibold text-text-primary mb-1">Asynchronous Progressive Enrichment</h4>
                <p className="text-text-secondary leading-relaxed">
                  FastAPI immediately returns the lexical score and schedules 6 parallel Celery worker tasks over Redis. These workers execute sandbox inspections: WHOIS registration dates, SSL certificate chains, HTTP redirect hops, fuzzy Levenshtein brand comparisons, blacklists, and HTML DOM elements.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-accent-blue/20 border border-accent-blue flex items-center justify-center text-[9px] font-bold text-accent-blue">3</span>
                <h4 className="font-semibold text-text-primary mb-1">SSE Progressive UI Updates</h4>
                <p className="text-text-secondary leading-relaxed">
                  The client UI listens to an SSE endpoint (/api/scan/&lt;scan_id&gt;/stream). As each celery worker finishes, it commits raw JSON payloads back to the database, which is immediately pushed down the threat stream to populate dashboard panels progressively.
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-accent-blue/20 border border-accent-blue flex items-center justify-center text-[9px] font-bold text-accent-blue">4</span>
                <h4 className="font-semibold text-text-primary mb-1">Verdict Fusion Algorithm</h4>
                <p className="text-text-secondary leading-relaxed">
                  Once all background enrichments conclude, a final score fusion runs on the server. The algorithm adjusts the base ML probability score based on real-time findings (e.g. domain registered &lt; 30 days adds 0.15, external form action targets add 0.14). If PhishTank matches, it triggers a warning override.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ML Specifications Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-card border border-border-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-4 h-4 text-accent-blue" />
              <span>Model & Training Pipeline</span>
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Our ensemble classifier is built using an XGBoost gradient-boosted tree model. To ensure high-quality training across unbalanced samples, we apply SMOTE (Synthetic Minority Over-sampling Technique) strictly to the training split, retaining a pristine held-out test split for verification.
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              We completed 50 hyperparameter search trials with Optuna, maximizing F1 and AUC-ROC thresholds. 
              The final pipeline runs an imputer, standard scaler, and XGBoost step, achieving <span className="font-bold text-safe-green font-mono">94.19% accuracy</span> and <span className="font-bold text-safe-green font-mono">0.983 AUC-ROC</span>.
            </p>
          </section>

          <section className="bg-card border border-border-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent-blue" />
              <span>Explainable AI (SHAP)</span>
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              SHAP values explain how individual model features drive the verdict. Calculated using game-theoretic Shapley values via TreeExplainer, every lexical prediction is mapped to a vector of positive (threat-promoting) or negative (safe-promoting) drivers.
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              For example, if a link has an unusually high entropy domain or nested subdomains, the SHAP dashboard identifies these features as the direct catalysts pushing the threat probability score toward the warning threshold.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
};
