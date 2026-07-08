"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface BybitStatus {
  connected: boolean;
  message: string;
  accountType?: number;
}

interface SyncResult {
  success: boolean;
  imported: number;
  skipped: number;
  message: string;
}

export default function BybitSettings({ onSyncComplete }: { onSyncComplete?: () => void }) {
  const [status, setStatus] = useState<BybitStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualKeys, setManualKeys] = useState({ apiKey: "", apiSecret: "" });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [category, setCategory] = useState<"linear" | "inverse">("linear");

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/bybit?action=status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false, message: "Не удалось проверить статус" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const testApiKeys = async () => {
    if (!manualKeys.apiKey || !manualKeys.apiSecret) {
      setTestResult({ success: false, message: "Введите API ключ и секрет" });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/bybit?action=test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualKeys),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: "Ошибка проверки" });
    } finally {
      setTesting(false);
    }
  };

  const syncTrades = async (syncAll = false) => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const action = syncAll ? "sync-all" : "sync";
      const body: Record<string, unknown> = { category };

      // If using manual keys, include them
      if (manualKeys.apiKey && manualKeys.apiSecret) {
        body.apiKey = manualKeys.apiKey;
        body.apiSecret = manualKeys.apiSecret;
      }

      const res = await fetch(`/api/bybit?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setSyncResult(data);

      if (data.success && data.imported > 0 && onSyncComplete) {
        onSyncComplete();
      }
    } catch {
      setSyncResult({
        success: false,
        imported: 0,
        skipped: 0,
        message: "Ошибка синхронизации",
      });
    } finally {
      setSyncing(false);
    }
  };

  const inputClass =
    "w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-accent focus:ring-1 focus:ring-blue-accent transition-colors font-mono text-sm";

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
        <h3 className="text-lg font-semibold text-white mb-4">🔗 Bybit API</h3>
        <div className="animate-pulse text-gray-500">Проверка подключения...</div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">🔗 Bybit API</h3>
        <span
          className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full",
            status?.connected
              ? "bg-green-profit/10 text-green-profit"
              : "bg-yellow-accent/10 text-yellow-accent"
          )}
        >
          {status?.connected ? "🟢 Подключено" : "⚪ Не подключено"}
        </span>
      </div>

      {/* Status Message */}
      <div className="bg-dark-700 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-300">{status?.message}</p>
        {status?.connected && status.accountType !== undefined && (
          <p className="text-xs text-gray-500 mt-1">
            Тип аккаунта: {status.accountType === 1 ? "Unified" : "Standard"}
          </p>
        )}
      </div>

      {/* Info Block */}
      <div className="bg-blue-accent/5 border border-blue-accent/20 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-blue-accent mb-2">ℹ️ Как подключить</h4>
        <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
          <li>
            Перейдите в{" "}
            <a
              href="https://www.bybit.com/app/user/api-management"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-accent hover:underline"
            >
              Bybit API Management
            </a>
          </li>
          <li>Создайте новый API ключ с разрешением &quot;Read-Only&quot;</li>
          <li>
            <strong className="text-yellow-accent">Важно:</strong> включите только &quot;Read&quot;
            права (Position, Trade History)
          </li>
          <li>Добавьте ключи ниже или настройте переменные окружения</li>
        </ol>
      </div>

      {/* Manual API Keys Input */}
      <div className="mb-4">
        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-sm text-blue-accent hover:text-blue-accent/80 transition-colors mb-3"
        >
          {showManualInput ? "▼ Скрыть ввод ключей" : "▶ Ввести API ключи вручную"}
        </button>

        {showManualInput && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <label className="block text-xs text-gray-400 mb-1">API Key</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Ваш Bybit API Key..."
                value={manualKeys.apiKey}
                onChange={(e) => setManualKeys({ ...manualKeys, apiKey: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">API Secret</label>
              <input
                type="password"
                className={inputClass}
                placeholder="Ваш Bybit API Secret..."
                value={manualKeys.apiSecret}
                onChange={(e) => setManualKeys({ ...manualKeys, apiSecret: e.target.value })}
              />
            </div>
            <button
              onClick={testApiKeys}
              disabled={testing || !manualKeys.apiKey || !manualKeys.apiSecret}
              className="w-full py-2.5 bg-dark-600 text-white rounded-lg text-sm font-medium hover:bg-dark-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? "Проверка..." : "🔍 Проверить подключение"}
            </button>

            {testResult && (
              <div
                className={cn(
                  "rounded-lg p-3 text-sm",
                  testResult.success
                    ? "bg-green-profit/10 text-green-profit border border-green-profit/20"
                    : "bg-red-loss/10 text-red-loss border border-red-loss/20"
                )}
              >
                {testResult.success ? "✅" : "❌"} {testResult.message}
              </div>
            )}

            <div className="bg-yellow-accent/5 border border-yellow-accent/20 rounded-lg p-3">
              <p className="text-xs text-yellow-accent">
                ⚠️ Ключи хранятся только в сессии браузера и не сохраняются на сервере. Для
                постоянного подключения добавьте переменные окружения BYBIT_API_KEY и
                BYBIT_API_SECRET.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Category Selection */}
      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-2">Категория контрактов</label>
        <div className="flex gap-2">
          <button
            onClick={() => setCategory("linear")}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              category === "linear"
                ? "bg-blue-accent/20 text-blue-accent border border-blue-accent/50"
                : "bg-dark-700 text-gray-400 border border-dark-600 hover:border-gray-500"
            )}
          >
            Linear (USDT)
          </button>
          <button
            onClick={() => setCategory("inverse")}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              category === "inverse"
                ? "bg-blue-accent/20 text-blue-accent border border-blue-accent/50"
                : "bg-dark-700 text-gray-400 border border-dark-600 hover:border-gray-500"
            )}
          >
            Inverse
          </button>
        </div>
      </div>

      {/* Sync Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => syncTrades(false)}
          disabled={syncing || (!status?.connected && !manualKeys.apiKey)}
          className="w-full py-3 bg-green-profit/20 text-green-profit rounded-lg text-sm font-semibold hover:bg-green-profit/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-green-profit/30"
        >
          {syncing ? "⏳ Синхронизация..." : "🔄 Импортировать последние 50 сделок"}
        </button>
        <button
          onClick={() => syncTrades(true)}
          disabled={syncing || (!status?.connected && !manualKeys.apiKey)}
          className="w-full py-3 bg-dark-700 text-white rounded-lg text-sm font-medium hover:bg-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? "⏳ Синхронизация..." : "📥 Импортировать всю историю (до 1000 сделок)"}
        </button>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div
          className={cn(
            "mt-4 rounded-lg p-4 animate-fade-in",
            syncResult.success
              ? "bg-green-profit/10 border border-green-profit/20"
              : "bg-red-loss/10 border border-red-loss/20"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{syncResult.success ? "✅" : "❌"}</span>
            <span
              className={cn(
                "font-semibold text-sm",
                syncResult.success ? "text-green-profit" : "text-red-loss"
              )}
            >
              {syncResult.success ? "Синхронизация завершена" : "Ошибка синхронизации"}
            </span>
          </div>
          <p className="text-sm text-gray-300">{syncResult.message}</p>
          {syncResult.success && (
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span>📥 Импортировано: {syncResult.imported}</span>
              <span>⏭️ Пропущено: {syncResult.skipped}</span>
            </div>
          )}
        </div>
      )}

      {/* Security Note */}
      <div className="mt-4 text-center">
        <span className="text-[10px] text-gray-600">
          🔒 Только чтение • Торговые операции не выполняются
        </span>
      </div>
    </div>
  );
}
