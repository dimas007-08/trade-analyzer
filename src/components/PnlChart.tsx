"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PnlChartProps {
  data: { date: string; pnl: number; ticker: string }[];
}

export default function PnlChart({ data }: PnlChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Кумулятивный PnL</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Добавьте сделки для отображения графика
        </div>
      </div>
    );
  }

  const lastPnl = data[data.length - 1]?.pnl ?? 0;
  const isPositive = lastPnl >= 0;

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">📈 Кумулятивный PnL</h3>
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${
            isPositive ? "bg-green-profit/10 text-green-profit" : "bg-red-loss/10 text-red-loss"
          }`}
        >
          {isPositive ? "+" : ""}${lastPnl.toFixed(2)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isPositive ? "#00e676" : "#ff5252"}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={isPositive ? "#00e676" : "#ff5252"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#243049" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getDate()}.${d.getMonth() + 1}`;
            }}
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
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "PnL"]}
            labelFormatter={(label) => {
              const d = new Date(label);
              return d.toLocaleDateString("ru-RU");
            }}
          />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke={isPositive ? "#00e676" : "#ff5252"}
            strokeWidth={2}
            fill="url(#pnlGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
