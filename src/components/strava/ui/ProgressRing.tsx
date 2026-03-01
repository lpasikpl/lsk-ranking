"use client";

interface ProgressRingProps {
  progress: number;       // % realizacji celu (0-100)
  yearProgress?: number;  // % upływu roku (0-100) — cienki zewnętrzny ring
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  yearProgress,
  size = 120,
  strokeWidth = 8,
  color = "var(--accent-orange)",
  children,
}: ProgressRingProps) {
  const hasYearRing = yearProgress !== undefined;
  const outerStroke = 3;
  const gap = 5;

  const mainRadius = (size - strokeWidth) / 2 - (hasYearRing ? outerStroke + gap : 0);
  const mainCirc = mainRadius * 2 * Math.PI;
  const clamped = Math.min(Math.max(progress, 0), 100);
  const targetOffset = mainCirc - (clamped / 100) * mainCirc;

  const outerRadius = (size - outerStroke) / 2;
  const outerCirc = outerRadius * 2 * Math.PI;
  const yearClamped = Math.min(Math.max(yearProgress ?? 0, 0), 100);
  const yearOffset = outerCirc - (yearClamped / 100) * outerCirc;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track głównego ringu */}
        <circle
          cx={size / 2} cy={size / 2} r={mainRadius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
        />
        {/* Główny ring — CSS @keyframes animation, odpala natychmiast po mount */}
        <circle
          cx={size / 2} cy={size / 2} r={mainRadius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: mainCirc,
            strokeDashoffset: mainCirc,
            // @ts-expect-error CSS custom property
            "--ring-target": targetOffset,
            animation: "ring-fill 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />
        {/* Zewnętrzny cienki ring — upływ roku */}
        {hasYearRing && (
          <>
            <circle
              cx={size / 2} cy={size / 2} r={outerRadius}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={outerStroke}
            />
            <circle
              cx={size / 2} cy={size / 2} r={outerRadius}
              fill="none"
              stroke="rgba(255,255,255,0.30)"
              strokeWidth={outerStroke}
              strokeLinecap="round"
              style={{
                strokeDasharray: outerCirc,
                strokeDashoffset: yearOffset,
              }}
            />
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
