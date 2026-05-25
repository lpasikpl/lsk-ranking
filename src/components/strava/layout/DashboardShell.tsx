import { Header } from "@/components/strava/layout/Header";
import { AutoRefresh } from "@/components/strava/layout/AutoRefresh";
import { TagFilterBar } from "@/components/strava/layout/TagFilterBar";

interface DashboardShellProps {
  children: React.ReactNode;
  excludedTags?: string[];
}

export function DashboardShell({ children, excludedTags = [] }: DashboardShellProps) {
  return (
    <div className="min-h-screen">
      <AutoRefresh />
      <Header />
      <div className="px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <div className="pt-4">
          <TagFilterBar excluded={excludedTags} />
        </div>
        <main className="pt-4 pb-12 space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
