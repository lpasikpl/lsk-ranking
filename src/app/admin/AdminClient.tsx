"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  strava_id: number;
  firstname: string | null;
  lastname: string | null;
  is_admin: boolean;
}

interface UserRow {
  id: string;
  strava_id: number;
  firstname: string | null;
  lastname: string | null;
  profile_medium: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface SyncLogRow {
  id: string;
  user_id: string | null;
  status: string;
  activities_synced: number | null;
  error_message: string | null;
  created_at: string;
  users: { firstname: string | null; lastname: string | null } | null;
}

interface BestEffortRow {
  user_id: string;
  firstname: string | null;
  lastname: string | null;
  effort_name: string;
  best_time: number;
  count: number;
  records: Array<{ moving_time: number; strava_activity_id: number; activity_date: string }>;
}

interface AdminClientProps {
  adminUser: AdminUser;
  initialUsers: UserRow[];
  syncLogs: SyncLogRow[];
  bestEfforts: BestEffortRow[];
}

export default function AdminClient({
  adminUser,
  initialUsers,
  syncLogs,
  bestEfforts,
}: AdminClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [activeTab, setActiveTab] = useState<"users" | "logs" | "efforts">("users");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedDistances, setExpandedDistances] = useState<Set<string>>(new Set());
  const [syncingAll, setSyncingAll] = useState(false);
  const [backfillingEfforts, setBackfillingEfforts] = useState(false);
  const [fixingTypes, setFixingTypes] = useState(false);
  const [syncingUser, setSyncingUser] = useState<string | null>(null);
  const [backfillingUser, setBackfillingUser] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const toggleActive = async (userId: string, currentActive: boolean) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !currentActive }),
    });

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: !currentActive } : u
        )
      );
      showMessage("success", `Użytkownik ${!currentActive ? "aktywowany" : "dezaktywowany"}`);
    } else {
      showMessage("error", "Błąd podczas zmiany statusu");
    }
  };

  const toggleAdmin = async (userId: string, currentAdmin: boolean) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_admin: !currentAdmin }),
    });

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_admin: !currentAdmin } : u
        )
      );
      showMessage("success", "Uprawnienia zmienione");
    } else {
      showMessage("error", "Błąd podczas zmiany uprawnień");
    }
  };

  const backfillUser = async (userId: string) => {
    setBackfillingUser(userId);
    try {
      const res = await fetch("/api/admin/backfill-efforts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, force: true }),
      });
      const data = await res.json();
      if (res.ok) {
        const u = data.users?.[0];
        showMessage("success", `Backfill: przetworzono ${u?.processed ?? 0}, pominięto ${u?.skipped ?? 0}, zapisano ${u?.saved ?? 0} wyników`);
        router.refresh();
      } else {
        showMessage("error", data.error || "Błąd backfilla");
      }
    } catch {
      showMessage("error", "Błąd połączenia");
    } finally {
      setBackfillingUser(null);
    }
  };

  const syncUser = async (userId: string) => {
    setSyncingUser(userId);
    const res = await fetch(`/api/sync/user/${userId}`, { method: "POST" });
    const data = await res.json();
    setSyncingUser(null);

    if (data.success) {
      showMessage("success", `Zsynchronizowano ${data.synced} aktywności`);
      router.refresh();
    } else {
      showMessage("error", `Błąd sync: ${data.error}`);
    }
  };

  const syncAll = async () => {
    if (!confirm("Zsynchronizować aktywności wszystkich użytkowników ze Stravy? Może potrwać kilka minut.")) return;
    setSyncingAll(true);

    const res = await fetch("/api/sync/all", {
      method: "POST",
    });
    const data = await res.json();
    setSyncingAll(false);

    if (data.success) {
      showMessage(
        "success",
        `Sync zakończony: ${data.results?.reduce((s: number, r: { synced: number }) => s + r.synced, 0)} aktywności dla ${data.users_processed} użytkowników`
      );
      router.refresh();
    } else {
      showMessage("error", "Błąd synchronizacji");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Panel Admina</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Zalogowany: {adminUser.firstname} {adminUser.lastname}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Ranking
            </Link>
            <a
              href="/api/auth/logout"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Wyloguj
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Komunikat */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Akcje globalne */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Synchronizacja</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Pobierz aktywności wszystkich użytkowników ze Stravy
            </p>
          </div>
          <button
            onClick={syncAll}
            disabled={syncingAll}
            className="px-4 py-2 bg-strava text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncingAll ? "Synchronizuję..." : "Sync wszystkich"}
          </button>
          <button
            onClick={async () => {
              if (!confirm("Pobierze best efforts dla wszystkich aktywności (~500 req). Może potrwać kilka minut. Kontynuować?")) return;
              setBackfillingEfforts(true);
              try {
                const res = await fetch("/api/admin/backfill-efforts", { method: "POST" });
                const data = await res.json();
                if (res.ok) {
                  showMessage("success", `Gotowe! Przetworzono ${data.total_processed}, pominięto ${data.total_skipped}, zapisano ${data.total_saved} wyników`);
                  router.refresh();
                } else {
                  showMessage("error", data.error || "Błąd backfilla");
                }
              } catch {
                showMessage("error", "Błąd połączenia — spróbuj ponownie");
              } finally {
                setBackfillingEfforts(false);
              }
            }}
            disabled={backfillingEfforts}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {backfillingEfforts ? "Pobieranie best efforts..." : "Backfill best efforts"}
          </button>
          <button
            onClick={async () => {
              if (!confirm("Usunie wszystkie best efforts starsze niż 2025-01-01. Kontynuować?")) return;
              try {
                const res = await fetch("/api/admin/cleanup-efforts", { method: "POST" });
                const data = await res.json();
                if (res.ok) {
                  showMessage("success", `Usunięto ${data.deleted} starych rekordów (przed 2025)`);
                  router.refresh();
                } else {
                  showMessage("error", data.error || "Błąd czyszczenia");
                }
              } catch {
                showMessage("error", "Błąd połączenia");
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Usuń pre-2025
          </button>
          <button
            onClick={async () => {
              if (!confirm("Usunie best efforts dla aktywności trainer=true i VirtualRide. Kontynuować?")) return;
              try {
                const res = await fetch("/api/admin/cleanup-indoor-efforts", { method: "POST" });
                const data = await res.json();
                if (res.ok) {
                  showMessage("success", `Usunięto ${data.deleted} rekordów indoor/virtual`);
                  router.refresh();
                } else {
                  showMessage("error", data.error || "Błąd czyszczenia");
                }
              } catch {
                showMessage("error", "Błąd połączenia");
              }
            }}
            className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors"
          >
            Usuń indoor/virtual
          </button>
          <button
            onClick={async () => {
              if (!confirm("Pobierze ponownie wszystkie aktywności od 2025-01-01 i zaktualizuje typy (sport_type). Może potrwać kilka minut. Kontynuować?")) return;
              setFixingTypes(true);
              try {
                const res = await fetch("/api/admin/fix-activity-types", { method: "POST" });
                const data = await res.json();
                if (res.ok) {
                  const details = data.results
                    ?.map((r: { name: string; synced: number; error?: string }) => `${r.name}: ${r.synced}`)
                    .join(", ");
                  showMessage("success", `Naprawiono typy! Zaktualizowano ${data.total} aktywności. [${details}]`);
                  router.refresh();
                } else {
                  showMessage("error", data.error || "Błąd naprawiania typów");
                }
              } catch {
                showMessage("error", "Błąd połączenia");
              } finally {
                setFixingTypes(false);
              }
            }}
            disabled={fixingTypes}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {fixingTypes ? "Naprawiam typy..." : "Napraw typy"}
          </button>
        </div>

        {/* Zakładki */}
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Użytkownicy ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "logs"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Logi sync ({syncLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("efforts")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "efforts"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Best Efforts ({bestEfforts.length})
          </button>
        </div>

        {/* Tabela użytkowników */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="text-left py-3 px-4 font-semibold">Użytkownik</th>
                    <th className="text-left py-3 px-4 font-semibold">Strava ID</th>
                    <th className="text-center py-3 px-4 font-semibold">Aktywny</th>
                    <th className="text-center py-3 px-4 font-semibold">Admin</th>
                    <th className="text-left py-3 px-4 font-semibold">Dołączył</th>
                    <th className="text-right py-3 px-4 font-semibold">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {user.profile_medium ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.profile_medium}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-200" />
                          )}
                          <span className="font-medium text-gray-800">
                            {user.firstname} {user.lastname}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`https://www.strava.com/athletes/${user.strava_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {user.strava_id}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleActive(user.id, user.is_active)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            user.is_active
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {user.is_active ? "Tak" : "Nie"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleAdmin(user.id, user.is_admin)}
                          disabled={user.id === adminUser.id}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-default ${
                            user.is_admin
                              ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {user.is_admin ? "Tak" : "Nie"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => syncUser(user.id)}
                            disabled={syncingUser === user.id}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                          >
                            {syncingUser === user.id ? "Sync..." : "Sync"}
                          </button>
                          <button
                            onClick={() => backfillUser(user.id)}
                            disabled={backfillingUser === user.id}
                            className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
                          >
                            {backfillingUser === user.id ? "Backfill..." : "Backfill"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Best Efforts */}
        {activeTab === "efforts" && (() => {
          const DIST_METERS: Record<string, number> = {
            "10 km": 10000, "20 km": 20000, "30 km": 30000,
            "40 km": 40000, "50 km": 50000, "100 km": 100000,
          };
          const fmtTime = (sec: number) => {
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = sec % 60;
            return h > 0
              ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
              : `${m}:${s.toString().padStart(2, "0")}`;
          };
          const fmtSpeed = (sec: number, effortName: string) => {
            const meters = DIST_METERS[effortName] ?? 0;
            return meters > 0 ? `${((meters / sec) * 3.6).toFixed(1)} km/h` : "";
          };

          // Grupuj po użytkowniku
          const byUser: Record<string, { user_id: string; firstname: string | null; lastname: string | null; distances: BestEffortRow[] }> = {};
          for (const row of bestEfforts) {
            if (!byUser[row.user_id]) {
              byUser[row.user_id] = { user_id: row.user_id, firstname: row.firstname, lastname: row.lastname, distances: [] };
            }
            byUser[row.user_id].distances.push(row);
          }
          const userList = Object.values(byUser).sort((a, b) =>
            `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`)
          );

          const toggleUser = (uid: string) => {
            setExpandedUsers(prev => {
              const next = new Set(prev);
              next.has(uid) ? next.delete(uid) : next.add(uid);
              return next;
            });
          };
          const toggleDist = (key: string) => {
            setExpandedDistances(prev => {
              const next = new Set(prev);
              next.has(key) ? next.delete(key) : next.add(key);
              return next;
            });
          };

          return (
            <div className="divide-y divide-gray-100">
              {userList.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Brak danych — uruchom Backfill best efforts
                </div>
              )}
              {userList.map(user => {
                const userExpanded = expandedUsers.has(user.user_id);
                const totalRecords = user.distances.reduce((s, d) => s + d.count, 0);
                return (
                  <div key={user.user_id}>
                    {/* Wiersz zawodnika */}
                    <div
                      onClick={() => toggleUser(user.user_id)}
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 select-none"
                    >
                      <span className="font-semibold text-gray-800 text-sm">
                        {user.firstname} {user.lastname}
                      </span>
                      <span className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{user.distances.length} dystansów · {totalRecords} rekordów</span>
                        <span>{userExpanded ? "▲" : "▼"}</span>
                      </span>
                    </div>

                    {/* Lista dystansów */}
                    {userExpanded && (
                      <div className="bg-gray-50 border-t border-gray-100 divide-y divide-gray-100">
                        {user.distances
                          .sort((a, b) => {
                            const order = ["10 km","20 km","30 km","40 km","50 km","100 km"];
                            return order.indexOf(a.effort_name) - order.indexOf(b.effort_name);
                          })
                          .map(dist => {
                            const distKey = `${user.user_id}_${dist.effort_name}`;
                            const distExpanded = expandedDistances.has(distKey);
                            const sortedRecs = [...dist.records].sort((a, b) => a.moving_time - b.moving_time);
                            return (
                              <div key={distKey}>
                                {/* Wiersz dystansu */}
                                <div
                                  onClick={() => toggleDist(distKey)}
                                  className="flex items-center justify-between px-4 pl-10 py-2 cursor-pointer hover:bg-blue-50/40 select-none"
                                >
                                  <span className="text-sm font-medium text-gray-700 w-16">{dist.effort_name}</span>
                                  <span className="font-mono text-sm text-gray-800">{fmtTime(dist.best_time)}</span>
                                  <span className="text-xs text-gray-400">{fmtSpeed(dist.best_time, dist.effort_name)}</span>
                                  <span className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>{dist.count} rekordów</span>
                                    <span>{distExpanded ? "▲" : "▼"}</span>
                                  </span>
                                </div>

                                {/* Lista indywidualnych czasów */}
                                {distExpanded && (
                                  <div className="bg-white border-t border-blue-100/60">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="text-gray-400 border-b border-gray-100">
                                          <th className="text-left py-1.5 px-4 pl-16 font-medium">#</th>
                                          <th className="text-left py-1.5 px-4 font-medium">Data</th>
                                          <th className="text-right py-1.5 px-4 font-medium">Czas</th>
                                          <th className="text-right py-1.5 px-4 font-medium">Prędkość</th>
                                          <th className="text-right py-1.5 px-4 font-medium">Link</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sortedRecs.map((rec, ri) => (
                                          <tr key={ri} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="py-1.5 px-4 pl-16 text-gray-400">{ri + 1}</td>
                                            <td className="py-1.5 px-4 text-gray-500">
                                              {new Date(rec.activity_date).toLocaleDateString("pl-PL", {
                                                day: "2-digit", month: "2-digit", year: "numeric",
                                              })}
                                            </td>
                                            <td className="py-1.5 px-4 text-right font-mono text-gray-800">
                                              {fmtTime(rec.moving_time)}
                                            </td>
                                            <td className="py-1.5 px-4 text-right text-gray-500">
                                              {fmtSpeed(rec.moving_time, dist.effort_name)}
                                            </td>
                                            <td className="py-1.5 px-4 text-right">
                                              <a
                                                href={`https://www.strava.com/activities/${rec.strava_activity_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-orange-600 hover:underline"
                                              >
                                                Strava ↗
                                              </a>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Logi synchronizacji */}
        {activeTab === "logs" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="text-left py-3 px-4 font-semibold">Data</th>
                    <th className="text-left py-3 px-4 font-semibold">Użytkownik</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 font-semibold">Aktywności</th>
                    <th className="text-left py-3 px-4 font-semibold">Błąd</th>
                  </tr>
                </thead>
                <tbody>
                  {syncLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      className={`border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="py-2.5 px-4 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-2.5 px-4 text-gray-700">
                        {log.users
                          ? `${log.users.firstname} ${log.users.lastname}`
                          : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.status === "success"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {log.status === "success" ? "OK" : "Błąd"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-gray-700">
                        {log.activities_synced ?? 0}
                      </td>
                      <td className="py-2.5 px-4 text-gray-500 text-xs max-w-xs truncate">
                        {log.error_message || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
