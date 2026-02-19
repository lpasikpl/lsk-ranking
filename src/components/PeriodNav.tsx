"use client";

import { useRouter } from "next/navigation";
import { format, addMonths, subMonths, addYears, subYears } from "date-fns";
import { pl } from "date-fns/locale";

interface PeriodNavProps {
  period: "month" | "year";
  year: number;
  month: number; // 1-12
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

  const goPrev = () => {
    if (period === "month") {
      navigate(subMonths(currentDate, 1));
    } else {
      navigate(subYears(currentDate, 1));
    }
  };

  const goNext = () => {
    if (period === "month") {
      navigate(addMonths(currentDate, 1));
    } else {
      navigate(addYears(currentDate, 1));
    }
  };

  const dateLabel =
    period === "month"
      ? format(currentDate, "LLLL yyyy", { locale: pl })
      : format(currentDate, "yyyy");

  const periodLabel =
    period === "month"
      ? `01 ${format(currentDate, "LLL", { locale: pl })} - ${format(new Date(year, month - 1, new Date(year, month, 0).getDate()), "dd LLL", { locale: pl })}`
      : year.toString();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Przełącznik Miesiąc / Rok */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => navigate(currentDate, "month")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            period === "month"
              ? "bg-gray-800 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Ranking Miesiąca
        </button>
        <button
          onClick={() => navigate(currentDate, "year")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            period === "year"
              ? "bg-gray-800 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Ranking Roku
        </button>
      </div>

      {/* Nawigacja dat */}
      <div className="flex items-center gap-3 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5">
        <button
          onClick={goPrev}
          className="hover:text-gray-900 font-bold text-base leading-none"
          aria-label="Poprzedni okres"
        >
          «
        </button>
        <span className="font-medium text-gray-800 min-w-[140px] text-center">
          {periodLabel}
        </span>
        <button
          onClick={goNext}
          className="hover:text-gray-900 font-bold text-base leading-none"
          aria-label="Następny okres"
        >
          »
        </button>
      </div>
    </div>
  );
}
