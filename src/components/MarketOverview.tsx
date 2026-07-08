"use client";

import { useState, useEffect, useCallback } from "react";
import { GlobalData, TrendingCoin } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatBigNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export default function MarketOverview() {
  const [global, setGlobal] = useState<GlobalData | null>(null);
  const [trending, setTrending] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const [globalRes, trendingRes] = await Promise.all([
        fetch("/api/market?action=global"),
        fetch("/api/market?action=trending"),
      ]);

      if (globalRes.ok) {
        const gData = await globalRes.json();
        if (!gData.error) setGlobal(gData);
      }

      if (trendingRes.ok) {
        const tData = await trendingRes.json();
        if (Array.isArray(tData)) setTrending(tData);
      }
    } catch {
      setError("Не удалось загрузить данные рынка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000); // refresh every 2 min
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
        <h3 className="text-lg font-semibold text-white mb-4">🌍 Обзор рынка</h3>
        <div className="h-32 flex items-center justify-center text-gray-500">
          <div className="animate-pulse">Загрузка рыночных данных...</div>
        </div>
      </div>
    );
  }

  if (error && !global) {
    return (
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
        <h3 className="text-lg font-semibold text-white mb-4">🌍 Обзор рынка</h3>
        <div className="h-32 flex items-center justify-center text-red-loss text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Global Stats Bar */}
      {global && (
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🌍</span>
            <h3 className="text-sm font-semibold text-white">Глобальный рынок криптовалют</h3>
            <span
              className={cn(
                "ml-auto text-xs font-medium px-2 py-0.5 rounded-full",
                global.marketCapChange24h >= 0
                  ? "bg-green-profit/10 text-green-profit"
                  : "bg-red-loss/10 text-red-loss"
              )}
            >
              {global.marketCapChange24h >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(global.marketCapChange24h).toFixed(2)}% за 24ч
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Капитализация</p>
              <p className="text-white font-mono font-semibold text-sm">
                {formatBigNumber(global.totalMarketCap)}
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Объём 24ч</p>
              <p className="text-white font-mono font-semibold text-sm">
                {formatBigNumber(global.totalVolume)}
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">BTC доминация</p>
              <p className="text-yellow-accent font-mono font-semibold text-sm">
                {global.btcDominance.toFixed(1)}%
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">ETH доминация</p>
              <p className="text-purple-accent font-mono font-semibold text-sm">
                {global.ethDominance.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trending Coins */}
      {trending.length > 0 && (
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔥</span>
            <h3 className="text-sm font-semibold text-white">Трендовые монеты</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {trending.slice(0, 10).map((coin) => (
              <div
                key={coin.id}
                className="bg-dark-700 rounded-lg p-2.5 hover:bg-dark-600 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  {coin.thumb && (
                    <img
                      src={coin.thumb}
                      alt={coin.name}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="text-white text-xs font-semibold truncate">
                    {coin.symbol.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  {coin.price !== undefined && (
                    <span className="text-gray-300 text-[11px] font-mono">
                      ${coin.price < 0.01
                        ? coin.price.toFixed(6)
                        : coin.price < 1
                          ? coin.price.toFixed(4)
                          : coin.price.toFixed(2)}
                    </span>
                  )}
                  {coin.change24h !== undefined && (
                    <span
                      className={cn(
                        "text-[10px] font-mono",
                        coin.change24h >= 0 ? "text-green-profit" : "text-red-loss"
                      )}
                    >
                      {coin.change24h >= 0 ? "+" : ""}
                      {coin.change24h.toFixed(1)}%
                    </span>
                  )}
                </div>
                {coin.rank && (
                  <span className="text-[10px] text-gray-600">#{coin.rank}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
