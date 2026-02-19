"use client";

import { useRouter } from "next/navigation";
import { format, addMonths, subMonths, addYears, subYears } from "date-fns";
import { pl } from "date-fns/locale";

interface PeriodNavProps {
  period: "month" | "year";
  year: number;
  month: number;
}

export default function PeriodNav({ period, year, month }: PeriodNavProps) {
  const router = useRouter();
  const currentDate = new Date(year, month - 1, 1);

  const navigate = (date: Date, newPeriod?: "month" | "year") => {
    const p = newPeriod || period;
    const params = new URLSearchParams({
      period: p,
      year: date.getFullYear().toString(),
      month: (date.getMonth() + 1).toString(),
    });
    router.push(`/?${params.toString()}`);
  };

  const goPrev = () => navigate(period === "month" ? subMonths(currentDate, 1) : subYears(currentDate, 1));
  const goNext = () => navigate(period === "month" ? addMonths(currentDate, 1) : addYears(currentDate, 1));

  const lastDay = new Date(year, month, 0).getDate();
  const periodLabel = period === "month"
    ? `01 ${format(currentDate, "LLL", { locale: pl })} – ${lastDay} ${format(currentDate, "LLL yyyy", { locale: pl })}`
    : year.toString();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Toggle */}
      <div className="flex rounded-xl overflow-hidden glass p-1 gap-1">
        <button
          onClick={() => navigate(currentDate, "month")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            period === "month"
              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Miesiąc
        </button>
        <button
          onClick={() => navigate(currentDate, "year")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            period === "year"
              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Rok
        </button>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3 glass rounded-xl px-4 py-2">
        <button onClick={goPrev} className="text-gray-500 hover:text-white transition-colors font-bold">‹</button>
        <span className="text-sm font-medium text-gray-300 min-w-[160px] text-center">{periodLabel}</span>
        <button onClick={goNext} className="text-gray-500 hover:text-white transition-colors font-bold">›</button>
      </div>
    </div>
  );
}
