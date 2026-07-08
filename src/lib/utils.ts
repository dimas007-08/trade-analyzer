export function formatCurrency(value: number): string {
  const absVal = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";
  if (value === 0) return "$0.00";
  return `${sign}$${absVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getDateStr(date: Date): string {
  return date.toISOString().slice(0, 16);
}
