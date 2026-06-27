import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface ShapItem {
  feature: string;
  display_name: string;
  value: number | string;
  shap: number;
  direction: 'phishing' | 'safe';
}

interface ShapChartProps {
  shapValues: ShapItem[];
}

export const ShapChart: React.FC<ShapChartProps> = ({ shapValues }) => {
  const chartData = [...shapValues]
    .sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap))
    .slice(0, 8)
    .reverse();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ShapItem;
      const directionColor = data.direction === 'phishing' ? 'text-phish-red' : 'text-safe-green';
      return (
        <div className="bg-card-elevated border border-border-card p-3 rounded shadow text-[10px] font-mono max-w-xs">
          <p className="font-semibold text-text-primary mb-1">{data.display_name}</p>
          <p className="text-text-secondary mb-1">
            Value: <span className="text-text-primary">{data.value}</span>
          </p>
          <p className="text-text-secondary">
            Weight: <span className={`font-bold ${directionColor}`}>{data.shap > 0 ? '+' : ''}{data.shap.toFixed(4)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-card border border-border-card rounded-lg p-6 flex flex-col justify-between h-full">
      <div className="mb-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest font-mono mb-1">
          Feature Importance (SHAP Weights)
        </h3>
        <p className="text-[10px] text-text-muted font-sans leading-relaxed">
          Game-theoretic Shapley contributions. Positive values (red) push the score toward phishing, negative values (green) toward safe.
        </p>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <XAxis 
              type="number" 
              domain={['dataMin - 0.05', 'dataMax + 0.05']} 
              tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'monospace' }}
              stroke="#27272a"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              dataKey="display_name" 
              type="category" 
              width={140} 
              tick={{ fill: '#9ca3af', fontSize: 9, fontFamily: 'monospace' }}
              stroke="#27272a"
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine x={0} stroke="#27272a" strokeWidth={1} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
            <Bar dataKey="shap" barSize={10} radius={[0, 2, 2, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.direction === 'phishing' ? '#f05252' : '#0e9f6e'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
