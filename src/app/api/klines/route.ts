import { NextRequest, NextResponse } from "next/server";

// Bybit public API for klines (no auth required)
const BYBIT_API = "https://api.bybit.com";

interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const entryTime = searchParams.get("entryTime");
  const exitTime = searchParams.get("exitTime");
  const interval = searchParams.get("interval") || "15"; // default 15 min

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    // Calculate time range
    let startTime: number;
    let endTime: number;

    if (entryTime && exitTime) {
      const entry = new Date(entryTime).getTime();
      const exit = new Date(exitTime).getTime();
      const duration = exit - entry;
      
      // Add padding before and after the trade
      const padding = Math.max(duration * 0.3, 3600000); // at least 1 hour padding
      startTime = entry - padding;
      endTime = exit + padding;
    } else {
      // Default: last 24 hours
      endTime = Date.now();
      startTime = endTime - 24 * 60 * 60 * 1000;
    }

    // Determine category based on symbol suffix
    let category = "linear";
    if (symbol.endsWith("USD") && !symbol.endsWith("USDT") && !symbol.endsWith("USDC")) {
      category = "inverse";
    } else if (!symbol.includes("USDT") && !symbol.includes("USDC") && !symbol.includes("USD")) {
      category = "spot";
    }

    // Fetch klines from Bybit
    const url = `${BYBIT_API}/v5/market/kline?category=${category}&symbol=${symbol}&interval=${interval}&start=${startTime}&end=${endTime}&limit=200`;
    
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Bybit API error: ${res.status}`);
    }

    const data = await res.json();

    if (data.retCode !== 0) {
      throw new Error(data.retMsg || "Failed to fetch klines");
    }

    // Parse klines - Bybit returns: [startTime, open, high, low, close, volume, turnover]
    const klines: KlineData[] = (data.result?.list || [])
      .map((k: string[]) => ({
        time: parseInt(k[0]),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }))
      .sort((a: KlineData, b: KlineData) => a.time - b.time); // Sort ascending by time

    return NextResponse.json({
      symbol,
      category,
      interval,
      klines,
    });
  } catch (error) {
    console.error("Klines API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch klines" },
      { status: 500 }
    );
  }
}
