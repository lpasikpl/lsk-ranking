"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { setActivityTags } from "@/app/strava/actions";
import { AVAILABLE_TAGS, TAG_COLORS } from "@/lib/strava-constants";

interface Props {
  activityId: number;
  initialTags: string[];
}

function tagChip(tag: string, onRemove?: () => void) {
  const color = TAG_COLORS[tag] ?? "#94a3b8";
  return (
    <span
      key={tag}
      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-current opacity-60 hover:opacity-100"
          aria-label={`Usuń tag ${tag}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

export function ActivityTagsCell({ activityId, initialTags }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function persist(next: string[]) {
    const prev = tags;
    setTags(next);
    startTransition(async () => {
      const res = await setActivityTags(activityId, next);
      if (!res.ok) {
        setTags(prev);
        console.error("setActivityTags failed", res.error);
      }
    });
  }

  function toggle(tag: string) {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    persist(next);
  }

  return (
    <div className="relative inline-flex items-center gap-1 flex-wrap" ref={popRef}>
      {tags.map((t) => tagChip(t, () => persist(tags.filter((x) => x !== t))))}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="text-[10px] px-1.5 py-0.5 rounded-full transition-colors"
        style={{
          color: "rgba(255,255,255,0.45)",
          border: "1px dashed rgba(255,255,255,0.15)",
          opacity: pending ? 0.5 : 1,
        }}
        title="Edytuj tagi"
      >
        {tags.length === 0 ? "+ tag" : "+"}
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 top-full right-0 rounded-lg p-2 min-w-[220px] space-y-1"
          style={{
            background: "#0f1117",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
          }}
        >
          {AVAILABLE_TAGS.map((tag) => {
            const active = tags.includes(tag);
            const color = TAG_COLORS[tag] ?? "#94a3b8";
            return (
              <label
                key={tag}
                className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggle(tag)}
                  className="accent-orange-500"
                />
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-white/80">{tag}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
