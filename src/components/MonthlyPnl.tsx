"use client";

import { cn } from "@/lib/utils";

interface MonthlyPnlProps {
  data: Record<string, number>;
}

const MONTHS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

export default function MonthlyPnl({ data }: MonthlyPnlProps) {
  const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));

  if (entries.length === 0) {
    return (
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
        <h3 className="text-lg font-semibold text-white mb-4">📅 PnL по месяцам</h3>
        <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
          Нет данных
        </div>
      </div>
    );
  }

  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)), 1);

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
      <h3 className="text-lg font-semibold text-white mb-4">📅 PnL по месяцам</h3>
      <div className="space-y-2">
        {entries.map(([key, value]) => {
          const [, month] = key.split("-");
          const monthName = MONTHS[parseInt(month) - 1] || month;
          const barWidth = (Math.abs(value) / maxAbs) * 100;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-16 shrink-0">
                {key.slice(0, 4)} {monthName}
              </span>
              <div className="flex-1 h-6 bg-dark-700 rounded-full overflow-hidden relative">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    value >= 0 ? "bg-green-profit/40" : "bg-red-loss/40"
                  )}
                  style={{ width: `${Math.max(barWidth, 2)}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-mono font-semibold w-20 text-right shrink-0",
                  value >= 0 ? "text-green-profit" : "text-red-loss"
                )}
              >
                {value >= 0 ? "+" : ""}${value.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
