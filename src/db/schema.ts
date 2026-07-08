import {
  pgTable,
  serial,
  text,
  real,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull(),
  direction: text("direction").notNull(), // 'long' | 'short'
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price").notNull(),
  quantity: real("quantity").notNull(),
  fees: real("fees").default(0),
  pnl: real("pnl").notNull(),
  pnlPercent: real("pnl_percent").notNull(),
  notes: text("notes"),
  tags: text("tags"), // comma-separated
  entryDate: timestamp("entry_date").notNull(),
  exitDate: timestamp("exit_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull(),
  targetPrice: real("target_price"),
  stopLoss: real("stop_loss"),
  notes: text("notes"),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
