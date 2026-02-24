"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const COMPETITION_TARGET = new Date("2026-04-01T00:00:00");

function useCountdown() {
  const [diff, setDiff] = useState(() => Math.max(0, COMPETITION_TARGET.getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, COMPETITION_TARGET.getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, []);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return `${String(d).padStart(2,"0")}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`;
}
import { User } from "@/types/database";

interface RankingHeaderProps {
  title: string;
  subtitle: string;
  user: Pick<User, "id" | "strava_id" | "firstname" | "lastname" | "profile_medium" | "is_admin"> | null;
}

function useSyncUser(userId: string) {
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setStatus("syncing");
    setMessage("Synchronizuję...");
    try {
      const res = await fetch(`/api/sync/user/${userId}`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setStatus("done");
        setMessage(`Zsynchronizowano ${data.synced} aktywności`);
        setTimeout(() => { setStatus("idle"); setMessage(""); window.location.reload(); }, 2000);
      } else {
        setStatus("error");
        setMessage(data.error || "Błąd synchronizacji");
        setTimeout(() => { setStatus("idle"); setMessage(""); }, 4000);
      }
    } catch {
      setStatus("error");
      setMessage("Błąd połączenia");
      setTimeout(() => { setStatus("idle"); setMessage(""); }, 4000);
    }
  };

  return { status, message, handleSync };
}

export default function RankingHeader({ title, subtitle, user }: RankingHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const countdown = useCountdown();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { status, message, handleSync } = useSyncUser(user?.id ?? "");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await fetch("/api/auth/logout");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="w-full border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          {/* Logo + Nav */}
          <div>
            <div className="flex items-center gap-1 mb-1 flex-wrap">
              <Link
                href="/"
                className={`text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-widest transition-colors ${
                  pathname === "/" ? "bg-orange-500/20 text-orange-400" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Ranking
              </Link>
              <Link
                href="/rywalizacja"
                className={`text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-widest transition-colors ${
                  pathname === "/rywalizacja" ? "bg-orange-500/20 text-orange-400" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Pre-Rywalizacja
              </Link>
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 uppercase tracking-widest cursor-default">
                Rywalizacja 2026
                <span className="text-gray-700 tabular-nums normal-case tracking-normal font-normal">{countdown}</span>
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">{title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-semibold text-orange-500 uppercase tracking-widest">Live</span>
            </div>
          </div>

          {/* Prawa strona */}
          <div className="flex items-center gap-3">
            {!user && (
              <a
                href="/api/auth/strava"
                className="flex items-center gap-2 glass rounded-lg px-3 py-1.5 text-xs font-medium text-orange-400 border border-orange-500/20 hover:border-orange-500/40 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                Zaloguj przez Stravę
              </a>
            )}

            {user && (
              <div className="relative" ref={menuRef}>
                {/* Hamburger */}
                <button
                  onClick={() => setOpen(v => !v)}
                  className="glass rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-white/[0.06] transition-colors"
                  aria-label="Menu"
                >
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-orange-400">{user.firstname?.charAt(0)}</span>
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <span className="block w-4 h-[2px] bg-gray-400 rounded" />
                    <span className="block w-4 h-[2px] bg-gray-400 rounded" />
                    <span className="block w-4 h-[2px] bg-gray-400 rounded" />
                  </div>
                </button>

                {/* Dropdown */}
                {open && (
                  <div className="absolute right-0 top-full mt-2 w-52 glass rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden z-50">
                    {/* Użytkownik */}
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <div className="text-sm font-semibold text-white">{user.firstname} {user.lastname}</div>
                      <div className="text-xs text-gray-400 mt-0.5">Zalogowany</div>
                    </div>

                    {/* Sync */}
                    <button
                      onClick={() => { handleSync(); }}
                      disabled={status === "syncing"}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/[0.05] transition-colors border-b border-white/[0.04] disabled:opacity-50"
                    >
                      {status === "syncing" ? (
                        <svg className="animate-spin w-4 h-4 text-orange-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                      ) : (
                        <span className="text-orange-400 text-base leading-none flex-shrink-0">↻</span>
                      )}
                      <span>
                        {status === "syncing" ? "Synchronizuję..." : status === "done" ? message : status === "error" ? message : "Synchronizuj Stravę"}
                      </span>
                    </button>

                    {/* Admin */}
                    {user.is_admin && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-purple-400 hover:bg-white/[0.05] transition-colors border-b border-white/[0.04]"
                      >
                        <span className="text-base leading-none flex-shrink-0">⚙️</span>
                        <span>Panel Admin</span>
                      </Link>
                    )}

                    {/* Wyloguj */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-white/[0.05] hover:text-red-400 transition-colors"
                    >
                      <span className="text-base leading-none flex-shrink-0">→</span>
                      <span>Wyloguj</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
