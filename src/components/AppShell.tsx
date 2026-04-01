import Sidebar from "./Sidebar";
import RankingHeader from "./RankingHeader";
import { User } from "@/types/database";

type AppUser =
  | Pick<User, "id" | "strava_id" | "firstname" | "lastname" | "profile_medium" | "is_admin">
  | null;

interface AppShellProps {
  user: AppUser;
  children: React.ReactNode;
}

export default function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Sidebar — widoczny tylko na desktop */}
      <Sidebar user={user} />

      {/* Prawa kolumna: mobile header + content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar — ukryty na desktop */}
        <div className="lg:hidden">
          <RankingHeader title="LSK Ranking" subtitle="Kolarstwo" user={user} />
        </div>

        {children}
      </div>
    </div>
  );
}
