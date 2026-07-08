"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TickerStats } from "@/lib/types";

interface TickerBreakdownProps {
  data: Record<string, TickerStats>;
}

export default function TickerBreakdown({ data }: TickerBreakdownProps) {
  const chartData = Object.entries(data)
    .map(([ticker, stats]) => ({
      ticker,
      pnl: Math.round(stats.pnl * 100) / 100,
      count: stats.count,
      winRate: Math.round((stats.wins / stats.count) * 100),
    }))
    .sort((a, b) => b.pnl - a.pnl);

  if (chartData.length === 0) {
    return (
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
        <h3 className="text-lg font-semibold text-white mb-4">📊 PnL по инструментам</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Нет данных
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
      <h3 className="text-lg font-semibold text-white mb-4">📊 PnL по инструментам</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#243049" />
          <XAxis
            dataKey="ticker"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a2235",
              border: "1px solid #243049",
              borderRadius: "8px",
              color: "#e2e8f0",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, _name: any, item: any) => {
              const entry = item?.payload;
              return [
                `$${Number(value).toFixed(2)} (${entry?.count} сделок, WR: ${entry?.winRate}%)`,
                "PnL",
              ];
            }}
          />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.pnl >= 0 ? "#00e676" : "#ff5252"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
