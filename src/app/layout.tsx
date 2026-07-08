import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeAnalyzer Pro — Торговый Анализатор",
  description: "Профессиональный анализатор торговых сделок для трейдеров",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
