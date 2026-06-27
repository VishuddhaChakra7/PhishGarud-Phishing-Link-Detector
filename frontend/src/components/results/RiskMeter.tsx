import React, { useEffect, useState } from 'react';

interface RiskMeterProps {
  confidence: number;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ confidence }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(confidence * 100);
    if (start === end) {
      setAnimatedScore(end);
      return;
    }
    const duration = 1000;
    const stepTime = Math.abs(Math.floor(duration / end));
    
    const timer = setInterval(() => {
      start += 1;
      setAnimatedScore(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [confidence]);

  const getColor = () => {
    if (confidence < 0.35) return 'bg-safe-green';
    if (confidence <= 0.65) return 'bg-suspicious-amber';
    return 'bg-phish-red';
  };

  const getBorderColor = () => {
    if (confidence < 0.35) return 'border-safe-green/20';
    if (confidence <= 0.65) return 'border-suspicious-amber/20';
    return 'border-phish-red/20';
  };

  return (
    <div className={`w-full bg-card border border-border-card rounded-lg p-6 flex flex-col justify-between ${getBorderColor()}`}>
      <div className="flex justify-between items-center mb-6">
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
          Risk Metrics Scale
        </span>
        <span className="font-mono text-xs text-text-secondary font-bold">
          {animatedScore}% Threat Probability
        </span>
      </div>

      {/* Minimal Linear Track */}
      <div className="relative w-full h-1.5 bg-card-elevated border border-border-card rounded-full mb-6">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${getColor()}`}
          style={{ width: `${confidence * 100}%` }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-text-primary border border-border-card rounded-full transition-all duration-1000 ease-out shadow"
          style={{ left: `calc(${confidence * 100}% - 7px)` }}
        />
      </div>

      <div className="flex justify-between text-[9px] font-mono text-text-muted uppercase tracking-wider">
        <span>Legitimate</span>
        <span>Warning Threshold</span>
        <span>Phishing</span>
      </div>
    </div>
  );
};
