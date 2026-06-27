import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScanDetails, postFeedback } from '../lib/api';
import { VerdictBanner } from '../components/results/VerdictBanner';
import { RiskMeter } from '../components/results/RiskMeter';
import { ShapChart } from '../components/results/ShapChart';
import { RedirectChain } from '../components/results/RedirectChain';
import { DomainCard } from '../components/results/DomainCard';
import { ThreatFeedCard } from '../components/results/ThreatFeedCard';
import { BrandCard } from '../components/results/BrandCard';
import { PageAnalysisCard } from '../components/results/PageAnalysisCard';
import { SecurityNarrative } from '../components/results/SecurityNarrative';
import { FeatureTable } from '../components/results/FeatureTable';
import { ArrowLeft, ThumbsUp, ThumbsDown, CheckCircle2, AlertCircle } from 'lucide-react';

export const Results: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const [scan, setScan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Feedback States
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctVerdict, setCorrectVerdict] = useState<'SAFE' | 'PHISHING'>('SAFE');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!scanId) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await getScanDetails(scanId);
        setScan(data);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve threat analysis details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [scanId]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanId) return;

    setSubmittingFeedback(true);
    try {
      await postFeedback(scanId, correctVerdict, feedbackComment);
      setFeedbackSubmitted(true);
      setShowCorrectionForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen pt-24 pb-16 px-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-text-secondary font-mono">
            Loading Threat Analysis Dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="w-full min-h-screen pt-24 pb-16 px-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-phish-red/5 border border-phish-red/20 p-6 rounded-2xl max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-phish-red" />
          <p className="text-sm font-semibold text-text-primary">Analysis Retrieve Failed</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            {error || 'The requested scan ID does not match any registered threat audit record.'}
          </p>
          <Link to="/" className="text-xs text-accent-blue font-semibold hover:underline mt-2">
            Return to threat scanner
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-card-elevated border border-transparent hover:border-border-card"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>New Scan</span>
          </Link>
          <span className="text-[10px] font-mono text-text-muted">
            REPORT ID: {scan.scan_id.toUpperCase()}
          </span>
        </div>

        {/* Verdict Banner Component */}
        <VerdictBanner
          url={scan.url}
          verdict={scan.verdict}
          confidence={scan.confidence}
          phishtankOverride={scan.phishtank_override}
        />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Column: RiskMeter + SecurityNarrative */}
          <div className="space-y-6 flex flex-col justify-between">
            <RiskMeter confidence={scan.confidence} />
            <SecurityNarrative tips={scan.security_tips} />
          </div>

          {/* Right Column: SHAP Chart */}
          <div className="h-full">
            <ShapChart shapValues={scan.shap_values} />
          </div>
        </div>

        {/* Redirect Tracer Chain if hops exist */}
        {scan.redirects && scan.redirects.hop_count > 0 && (
          <RedirectChain
            hops={scan.redirects.hops}
            hopCount={scan.redirects.hop_count}
            crossesDomain={scan.redirects.crosses_domain}
            verdict={scan.verdict}
          />
        )}

        {/* Domain Forensics Card (WHOIS & SSL) */}
        <DomainCard whois={scan.whois} ssl={scan.ssl} />

        {/* Brand Homoglyphs and Threat Aggregation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ThreatFeedCard threats={scan.threat_feeds} />
          <BrandCard brand={scan.brand_match} />
        </div>

        {/* DOM HTML Analysis Card */}
        <PageAnalysisCard page={scan.page_analysis} />

        {/* Expandable Lexical Features Auditing Table */}
        <FeatureTable features={scan.features} />

        {/* User Verdict Correction Feedback Form */}
        <div className="w-full bg-card border border-border-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary mb-1">
                Help Train PhishGarud
              </h3>
              <p className="text-xs text-text-muted">
                Is this verdict correct? Submit corrections to help retrain the ensemble classifier.
              </p>
            </div>

            {feedbackSubmitted ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-safe-green bg-safe-green/10 border border-safe-green/20 py-2 px-4 rounded-xl shrink-0 animate-scale-up">
                <CheckCircle2 className="w-4 h-4" />
                <span>Correction submitted! Thank you.</span>
              </div>
            ) : !showCorrectionForm ? (
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => setFeedbackSubmitted(true)}
                  className="flex items-center gap-2 border border-border-card hover:border-safe-green/30 hover:bg-safe-green/5 text-text-secondary hover:text-safe-green text-xs font-semibold py-2 px-4 rounded-xl transition-all"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Correct</span>
                </button>
                <button
                  onClick={() => setShowCorrectionForm(true)}
                  className="flex items-center gap-2 border border-border-card hover:border-phish-red/30 hover:bg-phish-red/5 text-text-secondary hover:text-phish-red text-xs font-semibold py-2 px-4 rounded-xl transition-all"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Incorrect Verdict</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* Expanded Feedback Submission Form */}
          {showCorrectionForm && (
            <form onSubmit={handleFeedbackSubmit} className="mt-6 border-t border-border-card pt-6 space-y-4 animate-slide-down">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary">
                  What is the correct classification?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="radio"
                      name="correctVerdict"
                      checked={correctVerdict === 'SAFE'}
                      onChange={() => setCorrectVerdict('SAFE')}
                      className="accent-accent-blue"
                    />
                    <span>SAFE (Legitimate link falsely flagged)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="radio"
                      name="correctVerdict"
                      checked={correctVerdict === 'PHISHING'}
                      onChange={() => setCorrectVerdict('PHISHING')}
                      className="accent-accent-blue"
                    />
                    <span>PHISHING (Deceptive link falsely cleared)</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary">
                  Provide optional comments (e.g. brand spoofed, redirection patterns)
                </label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us what we missed (e.g. mimicry of Paypal login form action target)..."
                  rows={3}
                  className="w-full bg-card-elevated border border-border-card rounded-xl p-3 text-xs outline-none focus:border-accent-blue text-text-primary"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCorrectionForm(false)}
                  className="text-xs font-semibold text-text-muted hover:text-text-primary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="bg-accent-blue hover:bg-blue-600 disabled:bg-card-elevated text-text-primary text-xs font-semibold py-2.5 px-5 rounded-xl transition-all"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Correction'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
