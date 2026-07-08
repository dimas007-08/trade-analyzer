"use client";

import { Trade } from "@/lib/types";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { useState } from "react";
import TradeDetailModal from "./TradeDetailModal";

interface TradesTableProps {
  trades: Trade[];
  onDelete: (id: number) => void;
}

export default function TradesTable({ trades, onDelete }: TradesTableProps) {
  const [filter, setFilter] = useState("");
  const [dirFilter, setDirFilter] = useState<"all" | "long" | "short">("all");
  const [sortBy, setSortBy] = useState<"date" | "pnl" | "ticker">("date");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const filtered = trades
    .filter((t) => {
      if (filter && !t.ticker.toLowerCase().includes(filter.toLowerCase())) return false;
      if (dirFilter !== "all" && t.direction !== dirFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "pnl") return b.pnl - a.pnl;
      if (sortBy === "ticker") return a.ticker.localeCompare(b.ticker);
      return new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime();
    });

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <>
      <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
        <div className="p-5 border-b border-dark-600">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                📋 Журнал сделок ({filtered.length})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Нажмите на сделку для просмотра графика
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="🔍 Поиск тикера..."
                className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-accent w-40"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <select
                className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-accent"
                value={dirFilter}
                onChange={(e) => setDirFilter(e.target.value as "all" | "long" | "short")}
              >
                <option value="all">Все</option>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
              <select
                className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-accent"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "pnl" | "ticker")}
              >
                <option value="date">По дате</option>
                <option value="pnl">По PnL</option>
                <option value="ticker">По тикеру</option>
              </select>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">📭</div>
            <p>Нет сделок для отображения</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dark-700/50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Тикер</th>
                  <th className="px-4 py-3 text-left">Напр.</th>
                  <th className="px-4 py-3 text-right">Вход</th>
                  <th className="px-4 py-3 text-right">Выход</th>
                  <th className="px-4 py-3 text-right">Кол-во</th>
                  <th className="px-4 py-3 text-right">PnL</th>
                  <th className="px-4 py-3 text-right">%</th>
                  <th className="px-4 py-3 text-left">Дата</th>
                  <th className="px-4 py-3 text-center">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/50">
                {filtered.map((trade) => (
                  <tr
                    key={trade.id}
                    onClick={() => setSelectedTrade(trade)}
                    className="hover:bg-dark-700/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{trade.ticker}</span>
                        {trade.tags && (
                          <div className="flex gap-1">
                            {trade.tags
                              .split(",")
                              .filter((t) => !t.includes("bybit:"))
                              .slice(0, 2)
                              .map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 bg-blue-accent/10 text-blue-accent rounded"
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                          </div>
                        )}
                        <span className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          📊
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded",
                          trade.direction === "long"
                            ? "bg-green-profit/10 text-green-profit"
                            : "bg-red-loss/10 text-red-loss"
                        )}
                      >
                        {trade.direction === "long" ? "▲ L" : "▼ S"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono">
                      ${Number(trade.entryPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono">
                      ${Number(trade.exitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono">
                      {Number(trade.quantity).toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-mono font-semibold",
                        trade.pnl >= 0 ? "text-green-profit" : "text-red-loss"
                      )}
                    >
                      {formatCurrency(trade.pnl)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-mono text-xs",
                        trade.pnlPercent >= 0 ? "text-green-profit" : "text-red-loss"
                      )}
                    >
                      {formatPercent(trade.pnlPercent)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(trade.exitDate).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => handleDelete(trade.id, e)}
                        className={cn(
                          "text-xs px-2 py-1 rounded transition-colors",
                          confirmDelete === trade.id
                            ? "bg-red-loss text-white"
                            : "text-gray-500 hover:text-red-loss hover:bg-red-loss/10"
                        )}
                      >
                        {confirmDelete === trade.id ? "Точно?" : "🗑️"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
      )}
    </>
  );
}
