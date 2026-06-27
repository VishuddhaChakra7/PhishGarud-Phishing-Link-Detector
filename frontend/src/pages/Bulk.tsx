import React, { useState, useRef } from 'react';
import { postBulkScan } from '../lib/api';
import { Upload, FileSpreadsheet, ShieldAlert, Download, ArrowRight } from 'lucide-react';

export const Bulk: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [results, setResults] = useState<any | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Invalid file type. Please upload a valid CSV file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const res = await postBulkScan(file);
      setResults(res);
    } catch (err: any) {
      setError(err.message || 'Bulk scan execution failed.');
    } finally {
      setLoading(false);
    }
  };

  // Convert results list to CSV data and trigger download
  const handleDownloadCSV = () => {
    if (!results || !results.scans) return;
    
    const headers = ['URL', 'Verdict', 'Threat Probability', 'Scanned At'];
    const rows = results.scans.map((s: any) => [
      s.url,
      s.verdict,
      s.confidence,
      s.scanned_at
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.map((val: any) => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `phishgarud_bulk_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="border-b border-border-card pb-5">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-accent-blue" />
            <div>
              <h1 className="text-xl font-bold text-text-primary font-sans">
                Bulk CSV Threat Scanning
              </h1>
              <p className="text-xs text-text-secondary">
                Upload a CSV spreadsheet containing a column labeled <span className="font-mono bg-card-elevated px-1 py-0.5 border border-border-card rounded font-semibold text-text-primary">url</span>. Processes up to 500 lines via fast lexical modeling.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Display: Form or Results */}
        {!results ? (
          <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-6">
            
            {/* Drag and Drop Container */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                dragOver 
                  ? 'border-accent-blue bg-accent-blue/5' 
                  : file 
                  ? 'border-safe-green bg-safe-green/5' 
                  : 'border-border-card bg-card hover:bg-card-elevated'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-4">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                  file ? 'bg-safe-green/10 border-safe-green/20 text-safe-green' : 'bg-card-elevated border-border-card text-text-secondary'
                }`}>
                  <Upload className="w-6 h-6" />
                </div>
                
                {file ? (
                  <div>
                    <p className="text-xs font-semibold text-text-primary mb-1">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-text-secondary font-mono">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-text-primary mb-1">
                      Drag and drop your spreadsheet, or click to browse
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Supports standard CSV files (comma delimited)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="flex items-center gap-2 bg-phish-red/10 border border-phish-red/25 text-phish-red p-3 rounded-xl text-xs animate-pulse-once">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading || !file}
                className="flex items-center gap-2 bg-accent-blue hover:bg-blue-600 disabled:bg-card-elevated disabled:text-text-muted text-text-primary text-sm font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-accent-blue/10 w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
                    <span>Processing Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <span>Inspect CSV</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Results Layout */
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-card border border-border-card rounded-2xl p-5 text-center">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                  Total Checked
                </span>
                <span className="font-mono text-2xl font-bold text-text-primary">
                  {results.summary.total}
                </span>
              </div>
              <div className="bg-card border border-border-card rounded-2xl p-5 text-center">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                  Phishing Confirmed
                </span>
                <span className="font-mono text-2xl font-bold text-phish-red">
                  {results.summary.phishing}
                </span>
              </div>
              <div className="bg-card border border-border-card rounded-2xl p-5 text-center">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                  Suspicious Flagged
                </span>
                <span className="font-mono text-2xl font-bold text-suspicious-amber">
                  {results.summary.suspicious}
                </span>
              </div>
              <div className="bg-card border border-border-card rounded-2xl p-5 text-center">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                  Legitimate / Safe
                </span>
                <span className="font-mono text-2xl font-bold text-safe-green">
                  {results.summary.safe}
                </span>
              </div>
            </div>

            {/* Actions & Report Download */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border-card rounded-2xl p-4">
              <div>
                <p className="text-xs font-semibold text-text-primary mb-1">
                  Export Scanned Report
                </p>
                <p className="text-[10px] text-text-muted">
                  Download the complete classification dataset including verdict categories and risk weights.
                </p>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 bg-safe-green hover:bg-green-600 text-text-primary text-xs font-semibold py-2 px-4 rounded-xl transition-all shadow-md shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Report CSV</span>
              </button>
            </div>

            {/* Scanned Items Table */}
            <div className="bg-card border border-border-card rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-card bg-page/30 text-text-muted uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-6">Scanned URL</th>
                      <th className="py-3.5 px-6">Model Verdict</th>
                      <th className="py-3.5 px-6">Threat Probability</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-card">
                    {results.scans.map((s: any, idx: number) => (
                      <tr key={idx} className="hover:bg-card-elevated/40 transition-colors">
                        <td className="py-4 px-6 font-mono text-text-secondary truncate max-w-lg" title={s.url}>
                          {s.url}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-bold uppercase text-[9px] font-mono tracking-wider px-2 py-0.5 border rounded-md ${
                            s.verdict === 'PHISHING' 
                              ? 'text-phish-red bg-phish-red/10 border-phish-red/20' 
                              : s.verdict === 'SUSPICIOUS'
                              ? 'text-suspicious-amber bg-suspicious-amber/10 border-suspicious-amber/20'
                              : 'text-safe-green bg-safe-green/10 border-safe-green/20'
                          }`}>
                            {s.verdict}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-text-primary font-bold">
                          {Math.round(s.confidence * 100)}%
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => { setResults(null); setFile(null); }}
                            className="text-[10px] font-semibold text-accent-blue hover:underline"
                          >
                            New scan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
