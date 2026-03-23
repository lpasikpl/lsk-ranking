// Główny wrapper dashboardu treningu z zakładkami
"use client";
import { useState } from "react";
import OverviewTab from "@/components/analiza/tabs/OverviewTab";
import DecouplingTab from "@/components/analiza/tabs/DecouplingTab";
import RouteMapTab from "@/components/analiza/tabs/RouteMapTab";
import GearsTab from "@/components/analiza/tabs/GearsTab";
import PedalingTab from "@/components/analiza/tabs/PedalingTab";
import AiCommentCard from "@/components/analiza/cards/AiCommentCard";

const TABS = [
  { id: "overview", label: "Podsumowanie" },
  { id: "decoupling", label: "Decoupling" },
  { id: "map", label: "Mapa" },
  { id: "gears", label: "Przerzutki" },
  { id: "pedaling", label: "Pedalowanie" },
];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

interface RideDashboardProps {
  activity: any;
  fitData: any | null;
  laps: any[];
  records: any[];
  gearEvents: any[];
  aiComments: Array<{ section: string; comment: string }>;
  athleteSettings: any | null;
}

export default function RideDashboard({
  activity, fitData, laps, records, gearEvents, aiComments, athleteSettings,
}: RideDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRequested, setAiRequested] = useState(false);

  const ftp = athleteSettings?.ftp ?? 280;
  const hasGears = fitData?.has_gear_data && gearEvents.length > 0;
  const hasPedaling = fitData?.has_pedaling_data;
  const hasMap = records.some(r => r.latitude != null);

  const getComment = (section: string) =>
    aiComments.find(c => c.section === section)?.comment ?? null;

  const hasAiComments = aiComments.length > 0;

  const requestAi = async () => {
    setAiLoading(true);
    try {
      await fetch(`/api/activities/${activity.id}/request-ai`, { method: "POST" });
      setAiRequested(true);
    } finally {
      setAiLoading(false);
    }
  };

  const visibleTabs = TABS.filter(t => {
    if (t.id === "gears") return hasGears;
    if (t.id === "pedaling") return hasPedaling;
    if (t.id === "map") return hasMap;
    return true;
  });

  return (
    <div>
      {/* Header aktywnosci */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>
          {activity.name ?? "Trening"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          {activity.start_date ? fmtDate(activity.start_date) : ""}
          {activity.sport_type && (
            <span className="ml-2 px-2 py-0.5 rounded text-xs"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              {activity.sport_type}
            </span>
          )}
        </p>
      </div>

      {/* Zakładki */}
      <div className="flex gap-1 mb-6 overflow-x-auto" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              color: activeTab === tab.id ? "#f97316" : "rgba(255,255,255,0.45)",
              borderBottom: activeTab === tab.id ? "2px solid #f97316" : "2px solid transparent",
              background: "transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Zawartość zakładki */}
      <div>
        {activeTab === "overview" && (
          <OverviewTab activity={activity} fitData={fitData} laps={laps} aiComment={getComment("overview")} />
        )}
        {activeTab === "decoupling" && (
          <DecouplingTab laps={laps} aiComment={getComment("decoupling")} />
        )}
        {activeTab === "map" && (
          <RouteMapTab records={records} ftp={ftp} />
        )}
        {activeTab === "gears" && (
          <GearsTab
            gearEvents={gearEvents}
            totalSeconds={activity.moving_time_seconds ?? 0}
            ftp={ftp}
            aiComment={getComment("gears")}
          />
        )}
        {activeTab === "pedaling" && (
          <PedalingTab records={records} fitData={fitData} aiComment={getComment("pedaling")} />
        )}
      </div>

      {/* Podsumowanie AI (zawsze na dole) */}
      <div
        className="mt-8 rounded-xl p-5"
        style={{ background: "#0d1a0d", border: "1px solid rgba(74,222,128,0.15)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: "rgba(74,222,128,0.8)" }}>
            Podsumowanie AI
          </h3>
          {!hasAiComments && !aiRequested && (
            <button
              onClick={requestAi}
              disabled={aiLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity"
              style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }}
            >
              {aiLoading ? "Wysyłanie..." : "Wygeneruj analize AI"}
            </button>
          )}
        </div>

        {aiLoading ? (
          <AiCommentCard comment={null} section="summary" loading />
        ) : aiRequested && !hasAiComments ? (
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Analiza AI zostala wysłana do przetworzenia. Odswiez strone za chwile.
          </p>
        ) : (
          <AiCommentCard comment={getComment("summary")} section="summary" />
        )}
      </div>
    </div>
  );
}
