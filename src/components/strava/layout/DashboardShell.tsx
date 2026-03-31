import { Header } from "@/components/strava/layout/Header";
import { AutoRefresh } from "@/components/strava/layout/AutoRefresh";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen">
      <AutoRefresh />
      <Header />
      <div className="px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <main className="pt-8 pb-12 space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
