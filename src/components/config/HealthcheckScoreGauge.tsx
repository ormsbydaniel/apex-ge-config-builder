import React from 'react';
import { RadialBar, RadialBarChart, PolarAngleAxis } from 'recharts';

interface HealthcheckScoreGaugeProps {
  label: string;
  /** 0–100 or null when no data is available yet */
  score: number | null;
  /** Dim slightly while a healthcheck run is in progress */
  isRunning?: boolean;
}

const colorForScore = (score: number | null): string => {
  if (score === null) return 'hsl(var(--muted-foreground))';
  if (score >= 80) return 'hsl(142 71% 45%)'; // green-600-ish
  if (score >= 50) return 'hsl(38 92% 50%)';  // amber-600-ish
  return 'hsl(0 84% 60%)';                     // red-600-ish
};

const textColorForScore = (score: number | null): string => {
  if (score === null) return 'text-muted-foreground';
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
};

export const HealthcheckScoreGauge: React.FC<HealthcheckScoreGaugeProps> = ({
  label,
  score,
  isRunning,
}) => {
  const arcColor = colorForScore(score);
  const data = [{ name: label, value: score ?? 0, fill: arcColor }];

  return (
    <div
      className={`flex flex-col items-center w-[110px] ${isRunning ? 'opacity-80' : ''}`}
      aria-label={`${label} score: ${score ?? 'not yet calculated'} out of 100`}
    >
      <div className="relative" style={{ width: 110, height: 70 }}>
        <RadialBarChart
          width={110}
          height={110}
          cx="50%"
          cy="100%"
          innerRadius="75%"
          outerRadius="100%"
          startAngle={180}
          endAngle={0}
          data={data}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            background={{ fill: 'hsl(var(--muted))' }}
            dataKey="value"
            cornerRadius={6}
          />
        </RadialBarChart>
        <div
          className={`absolute inset-x-0 bottom-0 text-center text-lg font-semibold tabular-nums ${textColorForScore(score)}`}
        >
          {score ?? '—'}
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground text-center leading-tight mt-0.5">
        {label}
      </div>
    </div>
  );
};

export default HealthcheckScoreGauge;
