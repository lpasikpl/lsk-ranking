"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@/types/database";
import SyncButton from "./SyncButton";

interface RankingHeaderProps {
  title: string;
  user: Pick<User, "id" | "strava_id" | "firstname" | "lastname" | "profile_medium" | "is_admin"> | null;
}

export default function RankingHeader({ title, user }: RankingHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="w-full bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-black tracking-widest uppercase text-gray-900">
            {title}
          </h1>
        </div>

        <div className="flex items-center justify-end gap-3 text-sm">
          {user ? (
            <>
              {user.is_admin && (
                <Link
                  href="/admin"
                  className="text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Admin
                </Link>
              )}
              <SyncButton userId={user.id} />
              <span className="text-gray-500">
                {user.firstname} {user.lastname}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                Wyloguj
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              Zaloguj przez Stravę
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
