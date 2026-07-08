"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export default function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-dark-800 rounded-xl p-5 border border-dark-600 hover:border-blue-accent/50 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-dark-700 text-blue-accent">{icon}</div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend === "up" && "bg-green-profit/10 text-green-profit",
              trend === "down" && "bg-red-loss/10 text-red-loss",
              trend === "neutral" && "bg-dark-600 text-gray-400"
            )}
          >
            {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p
        className={cn(
          "text-2xl font-bold",
          trend === "up" && "text-green-profit",
          trend === "down" && "text-red-loss",
          !trend && "text-white"
        )}
      >
        {value}
      </p>
      {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}
