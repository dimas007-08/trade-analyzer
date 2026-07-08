"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TradeFormProps {
  onSubmit: () => void;
  onClose: () => void;
}

export default function TradeForm({ onSubmit, onClose }: TradeFormProps) {
  const [form, setForm] = useState({
    ticker: "",
    direction: "long" as "long" | "short",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    fees: "",
    notes: "",
    tags: "",
    entryDate: new Date().toISOString().slice(0, 16),
    exitDate: new Date().toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.ticker || !form.entryPrice || !form.exitPrice || !form.quantity) {
      setError("Заполните все обязательные поля");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          entryPrice: Number(form.entryPrice),
          exitPrice: Number(form.exitPrice),
          quantity: Number(form.quantity),
          fees: Number(form.fees) || 0,
        }),
      });

      if (!res.ok) throw new Error("Failed to create trade");

      onSubmit();
    } catch {
      setError("Ошибка при сохранении сделки");
    } finally {
      setLoading(false);
    }
  };

  const pnlPreview = (() => {
    const entry = Number(form.entryPrice);
    const exit = Number(form.exitPrice);
    const qty = Number(form.quantity);
    const fees = Number(form.fees) || 0;
    if (!entry || !exit || !qty) return null;
    const raw = form.direction === "long" ? (exit - entry) * qty : (entry - exit) * qty;
    return raw - fees;
  })();

  const inputClass =
    "w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-accent focus:ring-1 focus:ring-blue-accent transition-colors";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-2xl border border-dark-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-dark-800 p-6 border-b border-dark-600 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">📝 Новая сделка</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-loss/10 border border-red-loss/30 rounded-lg p-3 text-red-loss text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Тикер *</label>
              <input
                type="text"
                className={inputClass}
                placeholder="AAPL, BTC, EUR/USD..."
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Направление *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, direction: "long" })}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg font-medium transition-all",
                    form.direction === "long"
                      ? "bg-green-profit/20 text-green-profit border border-green-profit/50"
                      : "bg-dark-700 text-gray-400 border border-dark-600 hover:border-gray-500"
                  )}
                >
                  ▲ Long
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, direction: "short" })}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg font-medium transition-all",
                    form.direction === "short"
                      ? "bg-red-loss/20 text-red-loss border border-red-loss/50"
                      : "bg-dark-700 text-gray-400 border border-dark-600 hover:border-gray-500"
                  )}
                >
                  ▼ Short
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Цена входа *</label>
              <input
                type="number"
                step="any"
                className={inputClass}
                placeholder="0.00"
                value={form.entryPrice}
                onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Цена выхода *</label>
              <input
                type="number"
                step="any"
                className={inputClass}
                placeholder="0.00"
                value={form.exitPrice}
                onChange={(e) => setForm({ ...form, exitPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Количество *</label>
              <input
                type="number"
                step="any"
                className={inputClass}
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Комиссии</label>
            <input
              type="number"
              step="any"
              className={inputClass}
              placeholder="0.00"
              value={form.fees}
              onChange={(e) => setForm({ ...form, fees: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Дата входа *</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.entryDate}
                onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Дата выхода *</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.exitDate}
                onChange={(e) => setForm({ ...form, exitDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Теги</label>
            <input
              type="text"
              className={inputClass}
              placeholder="breakout, earnings, scalp..."
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Заметки</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Описание сделки, причина входа..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {pnlPreview !== null && (
            <div
              className={cn(
                "rounded-lg p-4 text-center font-bold text-lg",
                pnlPreview >= 0
                  ? "bg-green-profit/10 text-green-profit border border-green-profit/30"
                  : "bg-red-loss/10 text-red-loss border border-red-loss/30"
              )}
            >
              Предварительный PnL: {pnlPreview >= 0 ? "+" : ""}${pnlPreview.toFixed(2)}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition-colors font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-accent text-white rounded-lg hover:bg-blue-accent/80 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "Сохранение..." : "💾 Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
