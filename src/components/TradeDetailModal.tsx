"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Trade } from "@/lib/types";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradeDetailModalProps {
  trade: Trade;
  onClose: () => void;
}

const INTERVALS = [
  { label: "1м", value: "1" },
  { label: "5м", value: "5" },
  { label: "15м", value: "15" },
  { label: "1ч", value: "60" },
  { label: "4ч", value: "240" },
  { label: "1д", value: "D" },
];

export default function TradeDetailModal({ trade, onClose }: TradeDetailModalProps) {
  const [klines, setKlines] = useState<Kline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [interval, setInterval] = useState("15");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchKlines = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        symbol: trade.ticker,
        entryTime: trade.entryDate,
        exitTime: trade.exitDate,
        interval,
      });

      const res = await fetch(`/api/klines?${params}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setKlines(data.klines || []);
      }
    } catch {
      setError("Не удалось загрузить данные графика");
    } finally {
      setLoading(false);
    }
  }, [trade.ticker, trade.entryDate, trade.exitDate, interval]);

  useEffect(() => {
    fetchKlines();
  }, [fetchKlines]);

  // Draw candlestick chart
  useEffect(() => {
    if (!canvasRef.current || klines.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, width, height);

    // Calculate price range
    const prices = klines.flatMap((k) => [k.high, k.low]);
    const entryPrice = Number(trade.entryPrice);
    const exitPrice = Number(trade.exitPrice);
    prices.push(entryPrice, exitPrice);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const pricePadding = priceRange * 0.05;

    const priceToY = (price: number) => {
      return (
        padding.top +
        chartHeight -
        ((price - (minPrice - pricePadding)) / (priceRange + pricePadding * 2)) * chartHeight
      );
    };

    // Time range
    const minTime = klines[0].time;
    const maxTime = klines[klines.length - 1].time;
    const timeRange = maxTime - minTime || 1;

    const timeToX = (time: number) => {
      return padding.left + ((time - minTime) / timeRange) * chartWidth;
    };

    // Draw grid
    ctx.strokeStyle = "#1a2235";
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const priceStep = priceRange / 5;
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + priceStep * i;
      const y = priceToY(price);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Price labels
      ctx.fillStyle = "#64748b";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(price.toFixed(2), width - padding.right + 5, y + 3);
    }

    // Draw candlesticks
    const candleWidth = Math.max(2, (chartWidth / klines.length) * 0.7);
    const wickWidth = 1;

    klines.forEach((kline) => {
      const x = timeToX(kline.time);
      const isGreen = kline.close >= kline.open;

      // Wick
      ctx.strokeStyle = isGreen ? "#00e676" : "#ff5252";
      ctx.lineWidth = wickWidth;
      ctx.beginPath();
      ctx.moveTo(x, priceToY(kline.high));
      ctx.lineTo(x, priceToY(kline.low));
      ctx.stroke();

      // Body
      const bodyTop = priceToY(Math.max(kline.open, kline.close));
      const bodyBottom = priceToY(Math.min(kline.open, kline.close));
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);

      ctx.fillStyle = isGreen ? "#00e676" : "#ff5252";
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Entry and Exit times
    const entryTime = new Date(trade.entryDate).getTime();
    const exitTime = new Date(trade.exitDate).getTime();

    // Draw entry line and marker
    const entryX = timeToX(entryTime);
    const entryY = priceToY(entryPrice);

    if (entryX >= padding.left && entryX <= width - padding.right) {
      // Entry vertical line
      ctx.strokeStyle = trade.direction === "long" ? "#00e67680" : "#ff525280";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(entryX, padding.top);
      ctx.lineTo(entryX, height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Entry horizontal line
      ctx.strokeStyle = trade.direction === "long" ? "#00e676" : "#ff5252";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding.left, entryY);
      ctx.lineTo(width - padding.right, entryY);
      ctx.stroke();

      // Entry marker
      ctx.fillStyle = trade.direction === "long" ? "#00e676" : "#ff5252";
      ctx.beginPath();
      if (trade.direction === "long") {
        // Triangle up
        ctx.moveTo(entryX, entryY - 15);
        ctx.lineTo(entryX - 8, entryY);
        ctx.lineTo(entryX + 8, entryY);
      } else {
        // Triangle down
        ctx.moveTo(entryX, entryY + 15);
        ctx.lineTo(entryX - 8, entryY);
        ctx.lineTo(entryX + 8, entryY);
      }
      ctx.closePath();
      ctx.fill();

      // Entry label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ВХОД", entryX, entryY - 20);
      ctx.font = "10px monospace";
      ctx.fillText(`$${entryPrice.toFixed(2)}`, entryX, entryY - 32);
    }

    // Draw exit line and marker
    const exitX = timeToX(exitTime);
    const exitY = priceToY(exitPrice);

    if (exitX >= padding.left && exitX <= width - padding.right) {
      // Exit vertical line
      ctx.strokeStyle = "#ffd74080";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(exitX, padding.top);
      ctx.lineTo(exitX, height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Exit horizontal line
      ctx.strokeStyle = "#ffd740";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding.left, exitY);
      ctx.lineTo(width - padding.right, exitY);
      ctx.stroke();

      // Exit marker (square)
      ctx.fillStyle = "#ffd740";
      ctx.fillRect(exitX - 6, exitY - 6, 12, 12);

      // Exit label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ВЫХОД", exitX, exitY + 25);
      ctx.font = "10px monospace";
      ctx.fillText(`$${exitPrice.toFixed(2)}`, exitX, exitY + 37);
    }

    // Draw PnL zone
    if (entryX >= padding.left && exitX <= width - padding.right) {
      const isProfit = trade.pnl >= 0;
      ctx.fillStyle = isProfit ? "rgba(0, 230, 118, 0.08)" : "rgba(255, 82, 82, 0.08)";
      ctx.fillRect(
        Math.min(entryX, exitX),
        Math.min(entryY, exitY),
        Math.abs(exitX - entryX),
        Math.abs(exitY - entryY)
      );
    }

    // Time labels
    ctx.fillStyle = "#64748b";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";

    const timeSteps = 5;
    for (let i = 0; i <= timeSteps; i++) {
      const time = minTime + (timeRange / timeSteps) * i;
      const x = timeToX(time);
      const date = new Date(time);
      const label = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      ctx.fillText(label, x, height - 10);
    }
  }, [klines, trade]);

  const isProfit = trade.pnl >= 0;
  const holdTime = new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime();
  const holdHours = holdTime / (1000 * 60 * 60);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-2xl border border-dark-600 w-full max-w-5xl max-h-[95vh] overflow-hidden animate-fade-in flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-dark-600 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {trade.ticker}
                <span
                  className={cn(
                    "text-sm font-medium px-2 py-0.5 rounded",
                    trade.direction === "long"
                      ? "bg-green-profit/20 text-green-profit"
                      : "bg-red-loss/20 text-red-loss"
                  )}
                >
                  {trade.direction === "long" ? "▲ LONG" : "▼ SHORT"}
                </span>
              </h2>
              <p className="text-sm text-gray-500">
                {new Date(trade.entryDate).toLocaleString("ru-RU")} →{" "}
                {new Date(trade.exitDate).toLocaleString("ru-RU")}
              </p>
            </div>
            <div
              className={cn(
                "text-2xl font-bold font-mono",
                isProfit ? "text-green-profit" : "text-red-loss"
              )}
            >
              {formatCurrency(trade.pnl)}
              <span className="text-sm ml-2 opacity-70">{formatPercent(trade.pnlPercent)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-lg hover:bg-dark-700"
          >
            ×
          </button>
        </div>

        {/* Chart Area */}
        <div className="flex-1 p-5 min-h-0">
          {/* Interval selector */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Таймфрейм:</span>
              <div className="flex gap-1">
                {INTERVALS.map((int) => (
                  <button
                    key={int.value}
                    onClick={() => setInterval(int.value)}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-medium transition-colors",
                      interval === int.value
                        ? "bg-blue-accent text-white"
                        : "bg-dark-700 text-gray-400 hover:text-white"
                    )}
                  >
                    {int.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>
                <span
                  className={cn(
                    "inline-block w-2 h-2 rounded-full mr-1",
                    trade.direction === "long" ? "bg-green-profit" : "bg-red-loss"
                  )}
                />
                Вход: ${Number(trade.entryPrice).toFixed(2)}
              </span>
              <span>
                <span className="inline-block w-2 h-2 rounded-full mr-1 bg-yellow-accent" />
                Выход: ${Number(trade.exitPrice).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-dark-900 rounded-xl border border-dark-600 h-80 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="animate-spin text-2xl mb-2">⏳</div>
                  <p className="text-sm">Загрузка графика...</p>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-sm text-red-loss mb-2">{error}</p>
                  <p className="text-xs text-gray-600">
                    График доступен только для Bybit тикеров
                  </p>
                </div>
              </div>
            ) : klines.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-sm">Нет данных для отображения</p>
                </div>
              </div>
            ) : (
              <canvas ref={canvasRef} className="w-full h-full" />
            )}
          </div>
        </div>

        {/* Trade Details */}
        <div className="p-5 border-t border-dark-600 shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Цена входа</p>
              <p className="text-white font-mono font-semibold">
                ${Number(trade.entryPrice).toFixed(2)}
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Цена выхода</p>
              <p className="text-white font-mono font-semibold">
                ${Number(trade.exitPrice).toFixed(2)}
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Количество</p>
              <p className="text-white font-mono font-semibold">
                {Number(trade.quantity).toFixed(4)}
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Время в сделке</p>
              <p className="text-white font-mono font-semibold">
                {holdHours < 1
                  ? `${Math.round(holdHours * 60)}м`
                  : holdHours < 24
                    ? `${holdHours.toFixed(1)}ч`
                    : `${(holdHours / 24).toFixed(1)}д`}
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Комиссии</p>
              <p className="text-white font-mono font-semibold">
                ${Number(trade.fees || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Notes & Tags */}
          {(trade.notes || trade.tags) && (
            <div className="mt-4 flex flex-wrap gap-4">
              {trade.tags && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Теги:</span>
                  <div className="flex gap-1">
                    {trade.tags.split(",").map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-blue-accent/10 text-blue-accent rounded"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {trade.notes && !trade.notes.startsWith("bybit:") && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Заметка:</span>
                  <span className="text-xs text-gray-300">{trade.notes}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
