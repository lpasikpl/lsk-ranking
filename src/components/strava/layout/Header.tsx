"use client";

import { CURRENT_YEAR } from "@/lib/strava-constants";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { revalidateStrava } from "@/app/strava/actions";

function SyncButton() {
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSync = async () => {
    setStatus("syncing");
    setMsg("");
    try {
      const res = await fetch("/api/admin/sync-priv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ after: "2025-01-01" }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("done");
        setMsg(`+${data.synced} aktywności`);
        setTimeout(() => { setStatus("idle"); setMsg(""); if (data.synced > 0) window.location.reload(); }, 3000);
      } else {
        setStatus("error");
        setMsg(data.error ?? "Błąd");
        setTimeout(() => { setStatus("idle"); setMsg(""); }, 4000);
      }
    } catch {
      setStatus("error");
      setMsg("Błąd połączenia");
      setTimeout(() => { setStatus("idle"); setMsg(""); }, 4000);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={status === "syncing"}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-white/10 text-gray-400 hover:text-orange-400 hover:border-orange-500/30 transition-colors disabled:opacity-50"
    >
      {status === "syncing" ? (
        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      ) : (
        <span>↻</span>
      )}
      {status === "idle" && "Sync"}
      {status === "syncing" && "Synchronizuję..."}
      {status === "done" && msg}
      {status === "error" && msg}
    </button>
  );
}

function RefreshButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleRefresh = async () => {
    setStatus("loading");
    await revalidateStrava();
    router.refresh();
    setStatus("done");
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={status === "loading"}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-white/10 text-gray-400 hover:text-sky-400 hover:border-sky-500/30 transition-colors disabled:opacity-50"
    >
      {status === "loading" ? (
        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      ) : (
        <span>⟳</span>
      )}
      {status === "idle" && "Odśwież"}
      {status === "loading" && "Odświeżam..."}
      {status === "done" && "Gotowe"}
    </button>
  );
}

export function Header() {
  return (
    <header className="flex items-center justify-between py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-[var(--accent-orange)]">Strava</span> Dashboard
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Sezon {CURRENT_YEAR} — kolarstwo szosowe
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <RefreshButton />
        <SyncButton />
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>
    </header>
  );
}
