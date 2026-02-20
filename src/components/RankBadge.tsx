// Ikony rankingowe w stylu Strava

function CrownIcon() {
  return (
    <svg width="26" height="21" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 29.5H37.5L35 17L27.5 24.5L20 2L12.5 24.5L5 17L2.5 29.5Z" fill="#FDB913"/>
      <path d="M12.5 18.5L14.6651 22.25H10.3349L12.5 18.5Z" fill="white"/>
      <path d="M27.5 18.5L29.6651 22.25H25.3349L27.5 18.5Z" fill="white"/>
      <path d="M20 12L22.8868 17H17.1132L20 12Z" fill="white"/>
    </svg>
  );
}

function TrophyIcon({ n }: { n: number }) {
  return (
    <svg width="24" height="26" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* uchwyty */}
      <path d="M4 4H2C2 7 3.5 8.5 4 9" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M16 4H18C18 7 16.5 8.5 16 9" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* kubek */}
      <path
        d="M4 2H16V9.5C16 12.5 13.3 15 10 15C6.7 15 4 12.5 4 9.5V2Z"
        fill="#F59E0B"
        stroke="#D97706"
        strokeWidth="0.5"
      />
      {/* nóżka */}
      <rect x="8.5" y="15" width="3" height="3" fill="#F59E0B" />
      {/* podstawa */}
      <rect x="6" y="18" width="8" height="2.5" rx="1.25" fill="#F59E0B" />
      {/* numer */}
      <text
        x="10"
        y="9"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={n >= 10 ? "8" : "11"}
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
        style={{ userSelect: "none" }}
      >
        {n}
      </text>
    </svg>
  );
}

interface RankBadgeProps {
  position: number; // 1-based
  showTrophyFrom?: number; // od której pozycji puchar (default: 2)
}

export default function RankBadge({ position, showTrophyFrom = 2 }: RankBadgeProps) {
  if (position === 1) return <CrownIcon />;
  if (position >= showTrophyFrom) return <TrophyIcon n={position} />;
  return null;
}
