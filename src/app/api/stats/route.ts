import { NextResponse } from "next/server";
import { db } from "@/db";
import { trades } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allTrades = await db
      .select()
      .from(trades)
      .orderBy(desc(trades.exitDate));

    if (allTrades.length === 0) {
      return NextResponse.json({
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnl: 0,
        avgWin: 0,
        avgLoss: 0,
        bestTrade: null,
        worstTrade: null,
        profitFactor: 0,
        avgRR: 0,
        maxDrawdown: 0,
        avgHoldTime: 0,
        byTicker: {},
        byDirection: { long: { count: 0, pnl: 0 }, short: { count: 0, pnl: 0 } },
        monthlyPnl: {},
        cumulativePnl: [],
        recentTrades: [],
      });
    }

    const wins = allTrades.filter((t) => t.pnl > 0);
    const losses = allTrades.filter((t) => t.pnl <= 0);

    const totalPnl = allTrades.reduce((s, t) => s + t.pnl, 0);
    const totalWins = wins.reduce((s, t) => s + t.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

    // By ticker
    const byTicker: Record<string, { count: number; pnl: number; wins: number }> = {};
    for (const t of allTrades) {
      if (!byTicker[t.ticker]) {
        byTicker[t.ticker] = { count: 0, pnl: 0, wins: 0 };
      }
      byTicker[t.ticker].count++;
      byTicker[t.ticker].pnl += t.pnl;
      if (t.pnl > 0) byTicker[t.ticker].wins++;
    }

    // By direction
    const longs = allTrades.filter((t) => t.direction === "long");
    const shorts = allTrades.filter((t) => t.direction === "short");

    // Monthly PnL
    const monthlyPnl: Record<string, number> = {};
    for (const t of allTrades) {
      const key = `${t.exitDate.getFullYear()}-${String(t.exitDate.getMonth() + 1).padStart(2, "0")}`;
      monthlyPnl[key] = (monthlyPnl[key] || 0) + t.pnl;
    }

    // Cumulative PnL (sorted by exitDate ascending)
    const sorted = [...allTrades].sort(
      (a, b) => a.exitDate.getTime() - b.exitDate.getTime()
    );
    let cumPnl = 0;
    const cumulativePnl = sorted.map((t) => {
      cumPnl += t.pnl;
      return {
        date: t.exitDate.toISOString().split("T")[0],
        pnl: Math.round(cumPnl * 100) / 100,
        ticker: t.ticker,
      };
    });

    // Max Drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let running = 0;
    for (const t of sorted) {
      running += t.pnl;
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // Average hold time in hours
    const totalHoldHours = allTrades.reduce((s, t) => {
      return s + (t.exitDate.getTime() - t.entryDate.getTime()) / (1000 * 60 * 60);
    }, 0);

    const bestTrade = sorted.reduce((best, t) => (t.pnl > best.pnl ? t : best), sorted[0]);
    const worstTrade = sorted.reduce((worst, t) => (t.pnl < worst.pnl ? t : worst), sorted[0]);

    return NextResponse.json({
      totalTrades: allTrades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: allTrades.length > 0 ? (wins.length / allTrades.length) * 100 : 0,
      totalPnl: Math.round(totalPnl * 100) / 100,
      avgWin: wins.length > 0 ? Math.round((totalWins / wins.length) * 100) / 100 : 0,
      avgLoss: losses.length > 0 ? Math.round((totalLosses / losses.length) * 100) / 100 : 0,
      bestTrade,
      worstTrade,
      profitFactor: totalLosses > 0 ? Math.round((totalWins / totalLosses) * 100) / 100 : totalWins > 0 ? Infinity : 0,
      avgRR:
        losses.length > 0 && wins.length > 0
          ? Math.round(((totalWins / wins.length) / (totalLosses / losses.length)) * 100) / 100
          : 0,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      avgHoldTime: Math.round((totalHoldHours / allTrades.length) * 10) / 10,
      byTicker,
      byDirection: {
        long: { count: longs.length, pnl: Math.round(longs.reduce((s, t) => s + t.pnl, 0) * 100) / 100 },
        short: { count: shorts.length, pnl: Math.round(shorts.reduce((s, t) => s + t.pnl, 0) * 100) / 100 },
      },
      monthlyPnl,
      cumulativePnl,
      recentTrades: allTrades.slice(0, 5),
    });
  } catch (error) {
    console.error("Error calculating stats:", error);
    return NextResponse.json(
      { error: "Failed to calculate stats" },
      { status: 500 }
    );
  }
}
