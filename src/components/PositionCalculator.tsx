"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export default function PositionCalculator() {
  const [calc, setCalc] = useState({
    accountSize: "",
    riskPercent: "",
    entryPrice: "",
    stopLoss: "",
  });

  const accountSize = Number(calc.accountSize);
  const riskPercent = Number(calc.riskPercent);
  const entryPrice = Number(calc.entryPrice);
  const stopLoss = Number(calc.stopLoss);

  const hasValues = accountSize > 0 && riskPercent > 0 && entryPrice > 0 && stopLoss > 0;

  const riskAmount = accountSize * (riskPercent / 100);
  const priceDiff = Math.abs(entryPrice - stopLoss);
  const positionSize = priceDiff > 0 ? riskAmount / priceDiff : 0;
  const positionValue = positionSize * entryPrice;
  const leverage = accountSize > 0 ? positionValue / accountSize : 0;

  const inputClass =
    "w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-accent focus:ring-1 focus:ring-blue-accent transition-colors";

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
      <h3 className="text-lg font-semibold text-white mb-4">🧮 Калькулятор позиции</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Размер счёта ($)</label>
          <input
            type="number"
            step="any"
            className={inputClass}
            placeholder="10000"
            value={calc.accountSize}
            onChange={(e) => setCalc({ ...calc, accountSize: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Риск на сделку (%)</label>
          <input
            type="number"
            step="any"
            className={inputClass}
            placeholder="1"
            value={calc.riskPercent}
            onChange={(e) => setCalc({ ...calc, riskPercent: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Цена входа ($)</label>
          <input
            type="number"
            step="any"
            className={inputClass}
            placeholder="150.00"
            value={calc.entryPrice}
            onChange={(e) => setCalc({ ...calc, entryPrice: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Стоп-лосс ($)</label>
          <input
            type="number"
            step="any"
            className={inputClass}
            placeholder="145.00"
            value={calc.stopLoss}
            onChange={(e) => setCalc({ ...calc, stopLoss: e.target.value })}
          />
        </div>

        {hasValues && (
          <div className="mt-4 space-y-2 animate-fade-in">
            <div className="bg-dark-700 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Риск в $</span>
                <span className="text-yellow-accent font-mono font-semibold">
                  ${riskAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Размер позиции</span>
                <span className="text-cyan-accent font-mono font-bold text-lg">
                  {positionSize.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Стоимость позиции</span>
                <span className="text-white font-mono font-semibold">
                  ${positionValue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Плечо</span>
                <span
                  className={cn(
                    "font-mono font-semibold",
                    leverage <= 1
                      ? "text-green-profit"
                      : leverage <= 3
                        ? "text-yellow-accent"
                        : "text-red-loss"
                  )}
                >
                  {leverage.toFixed(2)}x
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Расстояние до стопа</span>
                <span className="text-gray-300 font-mono">
                  {((priceDiff / entryPrice) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
