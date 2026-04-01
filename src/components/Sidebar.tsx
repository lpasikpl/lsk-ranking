"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type SidebarUser = {
  id: string;
  firstname: string | null;
  lastname: string | null;
  profile_medium: string | null;
  is_admin: boolean;
} | null;

export default function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    setSyncMsg("Synchronizuję...");
    try {
      const res = await fetch(`/api/sync/user/${user.id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSyncMsg(`Zsynchronizowano ${data.synced}`);
        setTimeout(() => {
          setSyncing(false);
          setSyncMsg("");
          window.location.reload();
        }, 2000);
      } else {
        setSyncMsg(data.error || "Błąd");
        setTimeout(() => { setSyncing(false); setSyncMsg(""); }, 4000);
      }
    } catch {
      setSyncMsg("Błąd połączenia");
      setTimeout(() => { setSyncing(false); setSyncMsg(""); }, 4000);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout");
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const NavLink = ({
    href,
    icon,
    label,
  }: {
    href: string;
    icon: string;
    label: string;
  }) => (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        isActive(href)
          ? "bg-orange-500/15 text-orange-400"
          : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
      }`}
    >
      <span className="w-5 text-center text-base">{icon}</span>
      {label}
    </Link>
  );

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-white/[0.06] sticky top-0 h-screen overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-white tracking-tight">LSK</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Ranking</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-orange-500 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* User brief */}
      {user && (
        <div className="px-4 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            {user.profile_medium ? (
              <Image
                src={user.profile_medium}
                alt=""
                width={30}
                height={30}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-orange-400">{user.firstname?.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {user.firstname} {user.lastname?.charAt(0)}.
              </div>
              <div className="text-[10px] text-gray-500">Zalogowany</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <NavLink href="/" icon="🏆" label="Ranking" />
        <NavLink href="/rywalizacja" icon="⚡" label="Rywalizacja 2026" />

        {user && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors disabled:opacity-50 text-left"
          >
            <span className={`w-5 text-center text-base ${syncing ? "animate-spin inline-block" : ""}`}>
              ↻
            </span>
            <span className="truncate">{syncMsg || "Synchronizacja"}</span>
          </button>
        )}

        {user?.is_admin && <NavLink href="/admin" icon="⚙️" label="Panel Admina" />}
      </nav>

      {/* Logout */}
      {user && (
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-white/[0.05] transition-colors"
          >
            <span className="w-5 text-center text-base">→</span>
            Wyloguj
          </button>
        </div>
      )}
    </aside>
  );
}
