import { Header } from "@/components/strava/layout/Header";
import { AutoRefresh } from "@/components/strava/layout/AutoRefresh";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <AutoRefresh />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header />
        <main className="pb-12 space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
