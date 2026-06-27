import React from 'react';
import { useScanStore } from '../../store/scanStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export const LoadingStream: React.FC = () => {
  const isScanning = useScanStore((state) => state.isScanning);
  const scanStep = useScanStore((state) => state.scanStep);
  const completedStages = useScanStore((state) => state.completedStages);

  if (!isScanning) return null;

  const stages = [
    { id: 'whois', label: 'WHOIS Registration Forensics' },
    { id: 'ssl', label: 'SSL Certificate Integrity' },
    { id: 'redirects', label: 'Redirect Chain Tracing' },
    { id: 'page', label: 'DOM Content Sandbox Analysis' },
    { id: 'brand', label: 'Brand Impersonation checks' },
    { id: 'threats', label: 'Threat Intelligence Feeds' }
  ];

  return (
    <div className="fixed inset-0 bg-page/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col items-center">
        {/* Animated Progress Ring */}
        <div className="relative w-24 h-24 mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#1e1e35"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#3b82f6"
              strokeWidth="6"
              fill="none"
              strokeDasharray="251.2"
              className="animate-spin origin-center"
              style={{
                strokeDashoffset: 180,
                transformOrigin: '50% 50%'
              }}
            />
          </svg>
        </div>

        {/* Current pulsing step message */}
        <div className="h-16 flex items-center justify-center text-center px-4 mb-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={scanStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-text-primary text-base font-medium tracking-tight font-sans"
            >
              {scanStep}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress Checklist */}
        <div className="w-full bg-card border border-border-card rounded-2xl p-5 space-y-3.5 shadow-xl">
          <p className="text-xs uppercase font-semibold text-text-muted tracking-wider mb-4">
            Enrichment Stream
          </p>
          
          {stages.map((stage) => {
            const isCompleted = completedStages.includes(stage.id);
            const isCurrent = !isCompleted && completedStages.length === stages.indexOf(stage);
            
            return (
              <div
                key={stage.id}
                className={`flex items-center justify-between text-sm transition-all duration-300 ${
                  isCompleted 
                    ? 'text-safe-green font-medium' 
                    : isCurrent 
                    ? 'text-accent-blue font-medium' 
                    : 'text-text-secondary opacity-50'
                }`}
              >
                <span className="font-sans">{stage.label}</span>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-safe-green shrink-0 animate-scale-up" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-accent-blue animate-spin shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-text-muted shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
