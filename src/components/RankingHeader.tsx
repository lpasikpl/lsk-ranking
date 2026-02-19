"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@/types/database";
import SyncButton from "./SyncButton";

interface RankingHeaderProps {
  title: string;
  subtitle: string;
  user: Pick<User, "id" | "strava_id" | "firstname" | "lastname" | "profile_medium" | "is_admin"> | null;
}

export default function RankingHeader({ title, subtitle, user }: RankingHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="w-full border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          {/* Logo / Tytuł */}
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-semibold text-orange-500 uppercase tracking-widest">
                {subtitle}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">
              {title}
            </h1>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                {user.is_admin && (
                  <Link
                    href="/admin"
                    className="text-gray-500 hover:text-gray-300 transition-colors text-xs"
                  >
                    Admin
                  </Link>
                )}
                <SyncButton userId={user.id} />
                <div className="flex items-center gap-2 glass rounded-lg px-3 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <span className="text-xs text-orange-400">
                      {user.firstname?.charAt(0)}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {user.firstname} {user.lastname?.charAt(0)}.
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-400 transition-colors ml-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </>
            ) : (
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
          </div>
        </div>
      </div>
    </header>
  );
}
