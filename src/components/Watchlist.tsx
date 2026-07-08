"use client";

import { useState, useEffect, useCallback } from "react";
import { WatchlistItem } from "@/lib/types";

export default function Watchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ticker: "",
    targetPrice: "",
    stopLoss: "",
    notes: "",
    priority: "0",
  });

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch watchlist:", err);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ticker) return;

    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm({ ticker: "", targetPrice: "", stopLoss: "", notes: "", priority: "0" });
    setShowForm(false);
    fetchItems();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/watchlist?id=${id}`, { method: "DELETE" });
    fetchItems();
  };

  const inputClass =
    "w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-accent transition-colors";

  const priorityColors: Record<number, string> = {
    0: "border-dark-600",
    1: "border-blue-accent/50",
    2: "border-yellow-accent/50",
    3: "border-red-loss/50",
  };

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">👁️ Watchlist</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm px-3 py-1 bg-blue-accent/20 text-blue-accent rounded-lg hover:bg-blue-accent/30 transition-colors"
        >
          {showForm ? "Скрыть" : "+ Добавить"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-2 animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              className={inputClass}
              placeholder="Тикер"
              value={form.ticker}
              onChange={(e) => setForm({ ...form, ticker: e.target.value })}
            />
            <select
              className={inputClass}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="0">Обычный</option>
              <option value="1">Важный</option>
              <option value="2">Высокий</option>
              <option value="3">Критический</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              className={inputClass}
              placeholder="Цель ($)"
              value={form.targetPrice}
              onChange={(e) => setForm({ ...form, targetPrice: e.target.value })}
            />
            <input
              type="number"
              step="any"
              className={inputClass}
              placeholder="Стоп ($)"
              value={form.stopLoss}
              onChange={(e) => setForm({ ...form, stopLoss: e.target.value })}
            />
          </div>
          <input
            type="text"
            className={inputClass}
            placeholder="Заметка"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-accent text-white rounded-lg text-sm hover:bg-blue-accent/80 transition-colors"
          >
            Добавить
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center text-gray-500 py-6 text-sm">
          <div className="text-2xl mb-2">🔭</div>
          Список наблюдения пуст
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-dark-700 rounded-lg p-3 border ${priorityColors[item.priority ?? 0]} group hover:bg-dark-600/50 transition-colors`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white text-sm">{item.ticker}</span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-500 hover:text-red-loss opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-3 text-xs text-gray-400">
                {item.targetPrice && (
                  <span>
                    🎯 ${Number(item.targetPrice).toFixed(2)}
                  </span>
                )}
                {item.stopLoss && (
                  <span>
                    🛑 ${Number(item.stopLoss).toFixed(2)}
                  </span>
                )}
              </div>
              {item.notes && (
                <p className="text-xs text-gray-500 mt-1 truncate">{item.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
