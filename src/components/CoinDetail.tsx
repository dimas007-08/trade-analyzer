"use client";

import { useState, useEffect, useCallback } from "react";
import { CoinDetail as CoinDetailType, ChartData } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CoinDetailProps {
  symbol: string;
  onClose: () => void;
}

function formatBigNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function formatPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(8)}`;
}

const PERIODS = [
  { label: "24ч", days: "1" },
  { label: "7д", days: "7" },
  { label: "30д", days: "30" },
  { label: "90д", days: "90" },
  { label: "1г", days: "365" },
];

export default function CoinDetailView({ symbol, onClose }: CoinDetailProps) {
  const [detail, setDetail] = useState<CoinDetailType | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [period, setPeriod] = useState("7");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDetail = useCallback(async () => {
    try {
      setError("");
      const res = await fetch(`/api/market?action=detail&symbol=${symbol}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setDetail(data);
      }
    } catch {
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const fetchChart = useCallback(async (days: string) => {
    try {
      setChartLoading(true);
      const res = await fetch(`/api/market?action=chart&symbol=${symbol}&days=${days}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (!data.error) setChart(data);
    } catch {
      // silently fail for chart
    } finally {
      setChartLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchDetail();
    fetchChart(period);
  }, [fetchDetail, fetchChart, period]);

  const handlePeriod = (days: string) => {
    setPeriod(days);
    fetchChart(days);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-dark-800 rounded-2xl border border-dark-600 w-full max-w-3xl p-8">
          <div className="animate-pulse text-center text-gray-500">Загрузка {symbol}...</div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-dark-800 rounded-2xl border border-dark-600 w-full max-w-3xl p-8 text-center">
          <p className="text-red-loss mb-4">{error || "Данные недоступны для этой монеты"}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  const isUp = detail.change24h >= 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-2xl border border-dark-600 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-dark-800 p-5 border-b border-dark-600 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {detail.image && (
              <img src={detail.image} alt={detail.name} className="w-8 h-8 rounded-full" />
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                {detail.name}{" "}
                <span className="text-gray-500 text-sm font-normal">
                  {detail.symbol} • #{detail.rank}
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Price */}
          <div className="flex items-end gap-4">
            <span className="text-3xl font-bold text-white font-mono">
              {formatPrice(detail.price)}
            </span>
            <span
              className={cn(
                "text-lg font-semibold font-mono pb-0.5",
                isUp ? "text-green-profit" : "text-red-loss"
              )}
            >
              {isUp ? "▲" : "▼"} {Math.abs(detail.change24h).toFixed(2)}%
            </span>
          </div>

          {/* Chart */}
          <div className="bg-dark-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">График цены</span>
              <div className="flex gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.days}
                    onClick={() => handlePeriod(p.days)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                      period === p.days
                        ? "bg-blue-accent text-white"
                        : "bg-dark-600 text-gray-400 hover:text-white"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {chartLoading ? (
              <div className="h-48 flex items-center justify-center text-gray-500 animate-pulse">
                Загрузка графика...
              </div>
            ) : chart && chart.prices && chart.prices.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chart.prices}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isUp ? "#00e676" : "#ff5252"}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={isUp ? "#00e676" : "#ff5252"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#243049" />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return period === "1"
                        ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
                        : d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
                    }}
                    minTickGap={40}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => formatPrice(v)}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a2235",
                      border: "1px solid #243049",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                      fontSize: "12px",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [formatPrice(Number(value)), "Цена"]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleString("ru-RU")
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isUp ? "#00e676" : "#ff5252"}
                    strokeWidth={2}
                    fill="url(#chartGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                Нет данных для графика
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">24ч макс</p>
              <p className="text-green-profit font-mono font-semibold text-sm">
                {formatPrice(detail.high24h)}
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">24ч мин</p>
              <p className="text-red-loss font-mono font-semibold text-sm">
                {formatPrice(detail.low24h)}
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Капитализация</p>
              <p className="text-white font-mono font-semibold text-sm">
                {formatBigNum(detail.marketCap)}
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Объём 24ч</p>
              <p className="text-white font-mono font-semibold text-sm">
                {formatBigNum(detail.volume24h)}
              </p>
            </div>
          </div>

          {/* Change percentages */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-dark-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">24 часа</p>
              <p
                className={cn(
                  "font-mono font-bold",
                  detail.change24h >= 0 ? "text-green-profit" : "text-red-loss"
                )}
              >
                {detail.change24h >= 0 ? "+" : ""}{detail.change24h?.toFixed(2)}%
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">7 дней</p>
              <p
                className={cn(
                  "font-mono font-bold",
                  detail.change7d >= 0 ? "text-green-profit" : "text-red-loss"
                )}
              >
                {detail.change7d >= 0 ? "+" : ""}{detail.change7d?.toFixed(2)}%
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">30 дней</p>
              <p
                className={cn(
                  "font-mono font-bold",
                  detail.change30d >= 0 ? "text-green-profit" : "text-red-loss"
                )}
              >
                {detail.change30d >= 0 ? "+" : ""}{detail.change30d?.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Supply & ATH */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">Предложение</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">В обращении</span>
                  <span className="text-white font-mono">
                    {detail.circulatingSupply
                      ? `${(detail.circulatingSupply / 1e6).toFixed(2)}M`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Всего</span>
                  <span className="text-white font-mono">
                    {detail.totalSupply
                      ? `${(detail.totalSupply / 1e6).toFixed(2)}M`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Макс.</span>
                  <span className="text-white font-mono">
                    {detail.maxSupply
                      ? `${(detail.maxSupply / 1e6).toFixed(2)}M`
                      : "∞"}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">ATH (исторический максимум)</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Цена</span>
                  <span className="text-yellow-accent font-mono font-semibold">
                    {formatPrice(detail.ath)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Дата</span>
                  <span className="text-white font-mono">
                    {detail.athDate
                      ? new Date(detail.athDate).toLocaleDateString("ru-RU")
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">От ATH</span>
                  <span className="text-red-loss font-mono">
                    {detail.athChangePercent?.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Read-only badge */}
          <div className="text-center pt-2">
            <span className="text-[10px] text-gray-600 bg-dark-700 px-3 py-1 rounded-full">
              🔒 Данные только для чтения • CoinGecko API • Обновляются автоматически
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
