"use client";

import { useState } from "react";

interface SyncButtonProps {
  userId: string;
}

export default function SyncButton({ userId }: SyncButtonProps) {
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setStatus("syncing");
    setMessage("Synchronizuję...");

    try {
      const res = await fetch(`/api/sync/user/${userId}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setStatus("done");
        setMessage(`Zsynchronizowano ${data.synced} aktywności`);
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
          window.location.reload();
        }, 2000);
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

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className={`text-xs ${status === "error" ? "text-red-500" : status === "done" ? "text-green-600" : "text-gray-500"}`}>
          {message}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={status === "syncing"}
        title="Synchronizuj aktywności ze Stravy"
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
          status === "syncing"
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : status === "done"
            ? "bg-green-50 text-green-700"
            : status === "error"
            ? "bg-red-50 text-red-600"
            : "bg-orange-50 text-orange-600 hover:bg-orange-100"
        }`}
      >
        {status === "syncing" ? (
          <span className="flex items-center gap-1">
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Sync...
          </span>
        ) : "↻ Sync"}
      </button>
    </div>
  );
}
