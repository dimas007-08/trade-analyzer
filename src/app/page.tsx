"use client";

import { useState, useEffect, useCallback } from "react";
import { Stats, Trade } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import StatCard from "@/components/StatCard";
import PnlChart from "@/components/PnlChart";
import TickerBreakdown from "@/components/TickerBreakdown";
import TradeForm from "@/components/TradeForm";
import TradesTable from "@/components/TradesTable";
import PositionCalculator from "@/components/PositionCalculator";
import Watchlist from "@/components/Watchlist";
import MonthlyPnl from "@/components/MonthlyPnl";
import MarketOverview from "@/components/MarketOverview";
import MarketTable from "@/components/MarketTable";
import CoinDetailView from "@/components/CoinDetail";
import BybitSettings from "@/components/BybitSettings";

type Tab = "dashboard" | "market" | "trades" | "tools";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, tradesRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/trades"),
      ]);
      const statsData = await statsRes.json();
      const tradesData = await tradesRes.json();
      setStats(statsData);
      setTrades(tradesData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTradeSubmit = () => {
    setShowForm(false);
    fetchData();
  };

  const handleDeleteTrade = async (id: number) => {
    await fetch(`/api/trades?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  // Map of known symbols in CoinGecko
  const KNOWN_CRYPTO = [
    "BTC","ETH","SOL","BNB","XRP","ADA","DOGE","DOT","MATIC","AVAX",
    "LINK","UNI","ATOM","LTC","NEAR","APT","ARB","OP","SUI","TIA",
    "TON","PEPE","SHIB","FIL","INJ",
  ];

  const handleSelectCoin = (symbol: string) => {
    if (KNOWN_CRYPTO.includes(symbol)) {
      setSelectedCoin(symbol);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4">📊</div>
          <div className="text-xl font-semibold text-white mb-2">TradeAnalyzer Pro</div>
          <div className="text-gray-500">Загрузка данных...</div>
          <div className="mt-4 w-48 h-1 bg-dark-700 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-blue-accent rounded-full animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-dark-800/80 backdrop-blur-xl border-b border-dark-600 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📊</div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">TradeAnalyzer Pro</h1>
                <p className="text-xs text-gray-500 leading-tight">Торговый анализатор</p>
              </div>
            </div>

            <nav className="flex items-center gap-1 bg-dark-700 rounded-xl p-1">
              {(
                [
                  { key: "dashboard" as Tab, label: "📈 Дашборд" },
                  { key: "market" as Tab, label: "💹 Рынок" },
                  { key: "trades" as Tab, label: "📋 Сделки" },
                  { key: "tools" as Tab, label: "🛠️ Инструменты" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    tab === key
                      ? "bg-blue-accent text-white shadow-lg shadow-blue-accent/20"
                      : "text-gray-400 hover:text-white hover:bg-dark-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            <button
              onClick={() => setShowForm(true)}
              className="px-3 sm:px-4 py-2 bg-green-profit/20 text-green-profit rounded-xl text-sm font-semibold hover:bg-green-profit/30 transition-all border border-green-profit/30 glow-pulse hidden sm:block"
            >
              + Новая сделка
            </button>
          </div>
        </div>
      </header>

      {/* Mobile add button */}
      <button
        onClick={() => setShowForm(true)}
        className="sm:hidden fixed bottom-6 right-6 z-30 w-14 h-14 bg-green-profit text-dark-900 rounded-full text-2xl font-bold shadow-lg shadow-green-profit/30 flex items-center justify-center"
      >
        +
      </button>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {tab === "dashboard" && stats && <DashboardView stats={stats} />}
        {tab === "market" && <MarketView onSelectCoin={handleSelectCoin} />}
        {tab === "trades" && (
          <TradesTable trades={trades} onDelete={handleDeleteTrade} />
        )}
        {tab === "tools" && <ToolsView onSyncComplete={fetchData} />}
      </main>

      {showForm && (
        <TradeForm onSubmit={handleTradeSubmit} onClose={() => setShowForm(false)} />
      )}

      {selectedCoin && (
        <CoinDetailView
          symbol={selectedCoin}
          onClose={() => setSelectedCoin(null)}
        />
      )}
    </div>
  );
}

function DashboardView({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Общий PnL"
          value={formatCurrency(stats.totalPnl)}
          subtitle={`${stats.totalTrades} сделок`}
          icon={<span className="text-xl">💰</span>}
          trend={stats.totalPnl > 0 ? "up" : stats.totalPnl < 0 ? "down" : "neutral"}
        />
        <StatCard
          title="Винрейт"
          value={`${stats.winRate.toFixed(1)}%`}
          subtitle={`${stats.winningTrades}W / ${stats.losingTrades}L`}
          icon={<span className="text-xl">🎯</span>}
          trend={stats.winRate >= 50 ? "up" : stats.winRate > 0 ? "down" : "neutral"}
        />
        <StatCard
          title="Ср. прибыль"
          value={formatCurrency(stats.avgWin)}
          subtitle={`Ср. убыток: ${formatCurrency(-stats.avgLoss)}`}
          icon={<span className="text-xl">📈</span>}
          trend="up"
        />
        <StatCard
          title="Profit Factor"
          value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
          subtitle={`R:R = ${stats.avgRR.toFixed(2)}`}
          icon={<span className="text-xl">⚡</span>}
          trend={stats.profitFactor >= 1 ? "up" : stats.profitFactor > 0 ? "down" : "neutral"}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Макс. просадка"
          value={formatCurrency(-stats.maxDrawdown)}
          icon={<span className="text-xl">📉</span>}
          trend={stats.maxDrawdown > 0 ? "down" : "neutral"}
        />
        <StatCard
          title="Ср. время сделки"
          value={
            stats.avgHoldTime < 24
              ? `${stats.avgHoldTime.toFixed(1)}ч`
              : `${(stats.avgHoldTime / 24).toFixed(1)}д`
          }
          icon={<span className="text-xl">⏱️</span>}
        />
        <StatCard
          title="Лонги"
          value={formatCurrency(stats.byDirection.long.pnl)}
          subtitle={`${stats.byDirection.long.count} сделок`}
          icon={<span className="text-xl">🟢</span>}
          trend={stats.byDirection.long.pnl > 0 ? "up" : stats.byDirection.long.pnl < 0 ? "down" : "neutral"}
        />
        <StatCard
          title="Шорты"
          value={formatCurrency(stats.byDirection.short.pnl)}
          subtitle={`${stats.byDirection.short.count} сделок`}
          icon={<span className="text-xl">🔴</span>}
          trend={stats.byDirection.short.pnl > 0 ? "up" : stats.byDirection.short.pnl < 0 ? "down" : "neutral"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PnlChart data={stats.cumulativePnl} />
        <TickerBreakdown data={stats.byTicker} />
      </div>

      {/* Monthly + Best/Worst */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyPnl data={stats.monthlyPnl} />

        <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
          <h3 className="text-lg font-semibold text-white mb-4">🏆 Лучшие и худшие сделки</h3>
          <div className="space-y-3">
            {stats.bestTrade && (
              <div className="bg-green-profit/5 border border-green-profit/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-green-profit font-semibold text-sm">🥇 Лучшая сделка</span>
                  <span className="text-green-profit font-mono font-bold">
                    {formatCurrency(stats.bestTrade.pnl)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {stats.bestTrade.ticker} — {stats.bestTrade.direction.toUpperCase()} —{" "}
                  {new Date(stats.bestTrade.exitDate).toLocaleDateString("ru-RU")}
                </p>
              </div>
            )}
            {stats.worstTrade && (
              <div className="bg-red-loss/5 border border-red-loss/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-red-loss font-semibold text-sm">💀 Худшая сделка</span>
                  <span className="text-red-loss font-mono font-bold">
                    {formatCurrency(stats.worstTrade.pnl)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {stats.worstTrade.ticker} — {stats.worstTrade.direction.toUpperCase()} —{" "}
                  {new Date(stats.worstTrade.exitDate).toLocaleDateString("ru-RU")}
                </p>
              </div>
            )}
            {!stats.bestTrade && !stats.worstTrade && (
              <div className="text-center text-gray-500 py-4 text-sm">
                Добавьте сделки для отображения
              </div>
            )}
          </div>

          {/* Recent trades preview */}
          {stats.recentTrades.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Последние сделки</h4>
              <div className="space-y-1.5">
                {stats.recentTrades.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between bg-dark-700 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs ${
                          t.direction === "long" ? "text-green-profit" : "text-red-loss"
                        }`}
                      >
                        {t.direction === "long" ? "▲" : "▼"}
                      </span>
                      <span className="text-white text-sm font-medium">{t.ticker}</span>
                    </div>
                    <span
                      className={`text-sm font-mono font-semibold ${
                        t.pnl >= 0 ? "text-green-profit" : "text-red-loss"
                      }`}
                    >
                      {formatCurrency(t.pnl)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketView({ onSelectCoin }: { onSelectCoin: (symbol: string) => void }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* API Info Banner */}
      <div className="bg-dark-800 rounded-xl p-4 border border-blue-accent/30 flex items-start gap-3">
        <span className="text-xl mt-0.5">🔌</span>
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">
            Привязка к рыночным данным • Только чтение
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Данные загружаются через{" "}
            <span className="text-blue-accent font-medium">CoinGecko API</span> в реальном времени.
            Доступны котировки, графики, капитализация и статистика для 25+ криптовалют.
            API работает в режиме <span className="text-yellow-accent">read-only</span> —
            никакие торговые операции через API не выполняются.
            Данные обновляются автоматически каждые 60 секунд.
          </p>
        </div>
      </div>

      <MarketOverview />
      <MarketTable onSelectCoin={onSelectCoin} />
    </div>
  );
}

function ToolsView({ onSyncComplete }: { onSyncComplete?: () => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Bybit Integration - Full width at top */}
      <div className="lg:col-span-2">
        <BybitSettings onSyncComplete={onSyncComplete} />
      </div>

      <PositionCalculator />
      <Watchlist />

      {/* Quick Reference */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-600 lg:col-span-2">
        <h3 className="text-lg font-semibold text-white mb-4">📚 Памятка трейдера</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-green-profit font-semibold text-sm mb-2">✅ Правила входа</h4>
            <ul className="text-xs text-gray-400 space-y-1.5">
              <li>• Определите тренд на старшем ТФ</li>
              <li>• Дождитесь подтверждения сигнала</li>
              <li>• Рассчитайте размер позиции по риску</li>
              <li>• Установите стоп-лосс ДО входа</li>
              <li>• R:R минимум 1:2</li>
            </ul>
          </div>
          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-yellow-accent font-semibold text-sm mb-2">⚠️ Управление рисками</h4>
            <ul className="text-xs text-gray-400 space-y-1.5">
              <li>• Не рискуйте более 1-2% на сделку</li>
              <li>• Максимум 5-6% на все позиции</li>
              <li>• Стоп после 3 убытков подряд</li>
              <li>• Не усредняйте убыточные позиции</li>
              <li>• Всегда используйте стоп-лоссы</li>
            </ul>
          </div>
          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-red-loss font-semibold text-sm mb-2">❌ Частые ошибки</h4>
            <ul className="text-xs text-gray-400 space-y-1.5">
              <li>• Торговля без плана</li>
              <li>• Revenge trading после убытка</li>
              <li>• Перемещение стоп-лосса</li>
              <li>• Слишком большое плечо</li>
              <li>• Игнорирование журнала сделок</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
