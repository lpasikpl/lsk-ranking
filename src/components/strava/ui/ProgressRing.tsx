"use client";

interface ProgressRingProps {
  progress: number;       // % realizacji celu (0–100)
  yearProgress?: number;  // % upływu roku (0–100)
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  yearProgress,
  size = 160,
  strokeWidth = 20,
  children,
}: ProgressRingProps) {
  const cx = size / 2;
  const cy = size / 2;

  // Zewnętrzny cienki ring — % upływu roku
  const innerStroke = 5;
  const gap = 10;
  const outerR = (size - innerStroke) / 2;
  const outerCirc = outerR * 2 * Math.PI;
  const yearClamped = Math.min(Math.max(yearProgress ?? 0, 0), 100);
  const yearOffset = outerCirc - (yearClamped / 100) * outerCirc;

  // Wewnętrzny gruby ring — % realizacji celu
  const innerR = outerR - innerStroke / 2 - gap - strokeWidth / 2;
  const innerCirc = innerR * 2 * Math.PI;
  const goalClamped = Math.min(Math.max(progress, 0), 100);
  const goalOffset = innerCirc - (goalClamped / 100) * innerCirc;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" overflow="visible">
        {/* === Zewnętrzny cienki ring — rok === */}
        {yearProgress !== undefined && (
          <>
            <circle
              cx={cx} cy={cy} r={outerR}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={innerStroke}
            />
            <circle
              cx={cx} cy={cy} r={outerR}
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={innerStroke}
              strokeLinecap="round"
              strokeDasharray={outerCirc}
              strokeDashoffset={yearOffset}
            />
          </>
        )}

        {/* === Wewnętrzny gruby ring — cel === */}
        <circle
          cx={cx} cy={cy} r={innerR}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx} cy={cy} r={innerR}
          fill="none"
          stroke="#FC4C02"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={innerCirc}
          strokeDashoffset={innerCirc}
        >
          <animate
            attributeName="stroke-dashoffset"
            from={innerCirc}
            to={goalOffset}
            dur="1.5s"
            begin="0.1s"
            fill="freeze"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.4 0 0.2 1"
          />
        </circle>
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
