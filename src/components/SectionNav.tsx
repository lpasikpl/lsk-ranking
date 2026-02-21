"use client";

import { useRouter } from "next/navigation";
import { format, addMonths, subMonths, addYears, subYears } from "date-fns";
import { pl } from "date-fns/locale";

interface SectionNavProps {
  type: "month" | "year";
  year: number;
  month: number;
  color: "orange" | "blue";
}

export default function SectionNav({ type, year, month, color }: SectionNavProps) {
  const router = useRouter();
  const date = new Date(year, month - 1, 1);

  const navigate = (newDate: Date) => {
    const params = new URLSearchParams(window.location.search);
    if (type === "month") {
      params.set("month", (newDate.getMonth() + 1).toString());
      params.set("year", newDate.getFullYear().toString());
    } else {
      params.set("ryear", newDate.getFullYear().toString());
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const goPrev = () => navigate(type === "month" ? subMonths(date, 1) : subYears(date, 1));
  const goNext = () => navigate(type === "month" ? addMonths(date, 1) : addYears(date, 1));

  const now = new Date();
  const isCurrentMonth = type === "month" && year === now.getFullYear() && month === now.getMonth() + 1;
  const isCurrentYear = type === "year" && year === now.getFullYear();
  const isAtMax = isCurrentMonth || isCurrentYear;

  const label = type === "month"
    ? format(date, "LLLL yyyy", { locale: pl }).toUpperCase()
    : year.toString();

  const accent = color === "orange" ? "bg-orange-500" : "bg-blue-500";
  const textAccent = color === "orange" ? "text-orange-500" : "text-blue-400";
  const sectionLabel = type === "month" ? "Ranking miesiąca" : "Ranking roczny";

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-1 h-6 rounded-full ${accent}`} />
      <div className="flex-1">
        <div className="text-xs text-gray-600 uppercase tracking-widest">{sectionLabel}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <button onClick={goPrev} className="text-gray-600 hover:text-white transition-colors text-lg leading-none">‹</button>
          <span className={`text-lg font-bold text-white min-w-[120px]`}>{label}</span>
          <button
            onClick={goNext}
            disabled={isAtMax}
            className="text-gray-600 hover:text-white transition-colors text-lg leading-none disabled:opacity-20 disabled:cursor-not-allowed"
          >›</button>
        </div>
      </div>
    </div>
  );
}
