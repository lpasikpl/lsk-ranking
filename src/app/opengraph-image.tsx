import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LSK Ranking - Ranking Kolarski";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#0f1117",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -60%)",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(252,76,2,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Dot + subtitle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#fc4c02",
            }}
          />
          <span style={{ color: "#fc4c02", fontSize: "18px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Kolarstwo
          </span>
        </div>

        {/* Title */}
        <div style={{ display: "flex", fontSize: "96px", fontWeight: 900, color: "#ffffff", letterSpacing: "-2px", lineHeight: 1 }}>
          LSK Ranking
        </div>

        {/* Divider */}
        <div
          style={{
            width: "80px",
            height: "4px",
            background: "#fc4c02",
            borderRadius: "2px",
            margin: "28px 0",
          }}
        />

        {/* Description */}
        <div style={{ color: "#9ca3af", fontSize: "28px", fontWeight: 400 }}>
          Ranking kolarski oparty na danych ze Stravy
        </div>

        {/* Bottom: Strava badge */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "60px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#fc4c02",
            fontSize: "16px",
            fontWeight: 700,
            letterSpacing: "0.15em",
          }}
        >
          POWERED BY STRAVA
        </div>
      </div>
    ),
    { ...size }
  );
}
