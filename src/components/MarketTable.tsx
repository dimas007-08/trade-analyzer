"use client";

import { useState, useEffect, useCallback } from "react";
import { MarketCoin } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatBigNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(8)}`;
}

// Mini sparkline component
function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 28;
  const w = 80;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#00e676" : "#ff5252"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface MarketTableProps {
  onSelectCoin?: (symbol: string) => void;
}

export default function MarketTable({ onSelectCoin }: MarketTableProps) {
  const [coins, setCoins] = useState<MarketCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "price" | "change" | "volume" | "mcap">("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchCoins = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/market?action=top&limit=50");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (Array.isArray(data)) {
        setCoins(data);
      }
    } catch {
      setError("Не удалось загрузить котировки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins();
    const interval = setInterval(fetchCoins, 60000);
    return () => clearInterval(interval);
  }, [fetchCoins]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir(col === "rank" ? "asc" : "desc");
    }
  };

  const filtered = coins
    .filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case "rank":
          diff = a.market_cap_rank - b.market_cap_rank;
          break;
        case "price":
          diff = a.current_price - b.current_price;
          break;
        case "change":
          diff = (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0);
          break;
        case "volume":
          diff = a.total_volume - b.total_volume;
          break;
        case "mcap":
          diff = a.market_cap - b.market_cap;
          break;
      }
      return sortDir === "asc" ? diff : -diff;
    });

  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    <span className="ml-1 text-[10px] opacity-50">
      {sortBy === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
        <h3 className="text-lg font-semibold text-white mb-4">💹 Котировки (CoinGecko API)</h3>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-dark-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && coins.length === 0) {
    return (
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
        <h3 className="text-lg font-semibold text-white mb-4">💹 Котировки</h3>
        <div className="text-center py-8">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-red-loss text-sm mb-2">{error}</p>
          <p className="text-gray-500 text-xs">
            API может быть временно недоступен (rate limit). Попробуйте позже.
          </p>
          <button
            onClick={fetchCoins}
            className="mt-3 px-4 py-2 bg-blue-accent/20 text-blue-accent rounded-lg text-sm hover:bg-blue-accent/30 transition-colors"
          >
            🔄 Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
      <div className="p-4 border-b border-dark-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">💹 Котировки</h3>
          <span className="text-[10px] px-2 py-0.5 bg-green-profit/10 text-green-profit rounded-full font-medium">
            LIVE • CoinGecko
          </span>
          <span className="text-[10px] text-gray-600">только чтение</span>
        </div>
        <input
          type="text"
          placeholder="🔍 Поиск монеты..."
          className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-accent w-52"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-dark-700/50 text-gray-400 text-xs uppercase tracking-wider">
              <th
                className="px-4 py-3 text-left cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("rank")}
              >
                # <SortIcon col="rank" />
              </th>
              <th className="px-4 py-3 text-left">Монета</th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("price")}
              >
                Цена <SortIcon col="price" />
              </th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("change")}
              >
                24ч <SortIcon col="change" />
              </th>
              <th className="px-4 py-3 text-right hidden md:table-cell">1ч</th>
              <th className="px-4 py-3 text-right hidden lg:table-cell">7д</th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors hidden sm:table-cell"
                onClick={() => handleSort("volume")}
              >
                Объём 24ч <SortIcon col="volume" />
              </th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors hidden md:table-cell"
                onClick={() => handleSort("mcap")}
              >
                Кап-ция <SortIcon col="mcap" />
              </th>
              <th className="px-4 py-3 text-center hidden lg:table-cell">7д график</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-600/30">
            {filtered.map((coin) => {
              const change24h = coin.price_change_percentage_24h ?? 0;
              const change1h = coin.price_change_percentage_1h_in_currency;
              const change7d = coin.price_change_percentage_7d_in_currency;
              const sparkData = coin.sparkline_in_7d?.price;

              return (
                <tr
                  key={coin.id}
                  className="hover:bg-dark-700/30 transition-colors cursor-pointer"
                  onClick={() => onSelectCoin?.(coin.symbol.toUpperCase())}
                >
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                    {coin.market_cap_rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <div>
                        <span className="text-white font-semibold text-sm">
                          {coin.symbol.toUpperCase()}
                        </span>
                        <span className="text-gray-500 text-xs ml-1.5 hidden sm:inline">
                          {coin.name}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-mono font-medium">
                    {formatPrice(coin.current_price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "font-mono text-xs font-semibold px-2 py-0.5 rounded",
                        change24h >= 0
                          ? "text-green-profit bg-green-profit/10"
                          : "text-red-loss bg-red-loss/10"
                      )}
                    >
                      {change24h >= 0 ? "+" : ""}
                      {change24h.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    {change1h !== null && change1h !== undefined ? (
                      <span
                        className={cn(
                          "font-mono text-xs",
                          change1h >= 0 ? "text-green-profit" : "text-red-loss"
                        )}
                      >
                        {change1h >= 0 ? "+" : ""}
                        {change1h.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    {change7d !== null && change7d !== undefined ? (
                      <span
                        className={cn(
                          "font-mono text-xs",
                          change7d >= 0 ? "text-green-profit" : "text-red-loss"
                        )}
                      >
                        {change7d >= 0 ? "+" : ""}
                        {change7d.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-gray-300 font-mono text-xs">
                      {formatBigNum(coin.total_volume)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="text-gray-300 font-mono text-xs">
                      {formatBigNum(coin.market_cap)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    {sparkData && sparkData.length > 0 && (
                      <MiniSparkline
                        data={sparkData}
                        positive={change7d !== null && change7d !== undefined ? change7d >= 0 : change24h >= 0}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center text-gray-500 text-sm">
          Ничего не найдено по запросу &ldquo;{search}&rdquo;
        </div>
      )}
    </div>
  );
}
