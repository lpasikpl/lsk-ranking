// Ikony rankingowe w stylu Strava

function CrownIcon() {
  // 3 wierzchołki: lewy (0,0), środkowy (30,0), prawy (60,0)
  // 2 wklęsłe łuki między nimi (sweep=1 = łuk idzie w dół)
  // trapez: góra szersza (0–60), dół węższy (12–48)
  return (
    <svg width="26" height="18" viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M 12 44 L 0 0 A 15.5 15.5 0 0 1 30 0 A 15.5 15.5 0 0 1 60 0 L 48 44 Z"
        fill="#F59E0B"
      />
      {/* diamenty */}
      <polygon points="13,27 18,32 13,37 8,32"  fill="white" opacity="0.88" />
      <polygon points="30,25 36,31 30,37 24,31" fill="white" opacity="0.88" />
      <polygon points="47,27 52,32 47,37 42,32" fill="white" opacity="0.88" />
    </svg>
  );
}

function TrophyIcon({ n }: { n: number }) {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        y="10.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={n >= 10 ? "7" : "9"}
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
