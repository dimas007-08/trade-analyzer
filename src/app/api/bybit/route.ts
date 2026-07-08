import { NextRequest, NextResponse } from "next/server";
import { RestClientV5 } from "bybit-api";
import { db } from "@/db";
import { trades } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get API keys from environment variables
const getBybitClient = (apiKey?: string, apiSecret?: string) => {
  const key = apiKey || process.env.BYBIT_API_KEY;
  const secret = apiSecret || process.env.BYBIT_API_SECRET;

  if (!key || !secret) {
    return null;
  }

  return new RestClientV5({
    key,
    secret,
    // Set to true for testnet
    testnet: process.env.BYBIT_TESTNET === "true",
  });
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "status";

  // Allow passing API keys via headers for testing (in production, use env vars)
  const headerKey = request.headers.get("x-bybit-api-key");
  const headerSecret = request.headers.get("x-bybit-api-secret");

  const client = getBybitClient(
    headerKey || undefined,
    headerSecret || undefined
  );

  if (!client && action !== "status") {
    return NextResponse.json(
      {
        error: "Bybit API credentials not configured",
        hint: "Set BYBIT_API_KEY and BYBIT_API_SECRET environment variables",
      },
      { status: 401 }
    );
  }

  try {
    switch (action) {
      case "status": {
        // Check if API is configured
        const hasEnvKeys = !!(
          process.env.BYBIT_API_KEY && process.env.BYBIT_API_SECRET
        );
        const hasHeaderKeys = !!(headerKey && headerSecret);

        if (!hasEnvKeys && !hasHeaderKeys) {
          return NextResponse.json({
            connected: false,
            message: "API ключи не настроены",
          });
        }

        // Try to get account info to verify connection
        try {
          const accountInfo = await client!.getAccountInfo();
          if (accountInfo.retCode === 0) {
            return NextResponse.json({
              connected: true,
              accountType: accountInfo.result?.unifiedMarginStatus,
              message: "Успешно подключено к Bybit",
            });
          } else {
            return NextResponse.json({
              connected: false,
              message: accountInfo.retMsg || "Ошибка подключения",
            });
          }
        } catch {
          return NextResponse.json({
            connected: false,
            message: "Не удалось подключиться к Bybit API",
          });
        }
      }

      case "balance": {
        // Get wallet balance
        const balance = await client!.getWalletBalance({ accountType: "UNIFIED" });
        if (balance.retCode !== 0) {
          throw new Error(balance.retMsg);
        }
        return NextResponse.json(balance.result);
      }

      case "closed-pnl": {
        // Get closed PnL (trade history)
        const category = (searchParams.get("category") as "linear" | "inverse" | "spot") || "linear";
        const symbol = searchParams.get("symbol") || undefined;
        const limit = parseInt(searchParams.get("limit") || "50");
        const cursor = searchParams.get("cursor") || undefined;

        const pnl = await client!.getClosedPnL({
          category,
          symbol,
          limit,
          cursor,
        });

        if (pnl.retCode !== 0) {
          throw new Error(pnl.retMsg);
        }

        return NextResponse.json({
          list: pnl.result.list,
          nextCursor: pnl.result.nextPageCursor,
          category: pnl.result.category,
        });
      }

      case "positions": {
        // Get current positions
        const category = (searchParams.get("category") as "linear" | "inverse") || "linear";
        const positions = await client!.getPositionInfo({ category, settleCoin: "USDT" });

        if (positions.retCode !== 0) {
          throw new Error(positions.retMsg);
        }

        return NextResponse.json(positions.result.list);
      }

      case "executions": {
        // Get execution history (all trades including partial fills)
        const category = (searchParams.get("category") as "linear" | "inverse" | "spot") || "linear";
        const symbol = searchParams.get("symbol") || undefined;
        const limit = parseInt(searchParams.get("limit") || "50");

        const executions = await client!.getExecutionList({
          category,
          symbol,
          limit,
        });

        if (executions.retCode !== 0) {
          throw new Error(executions.retMsg);
        }

        return NextResponse.json(executions.result.list);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Bybit API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bybit API error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "sync";

  const body = await request.json().catch(() => ({}));
  const { apiKey, apiSecret } = body;

  const client = getBybitClient(apiKey, apiSecret);

  if (!client) {
    return NextResponse.json(
      {
        error: "Bybit API credentials not provided",
        hint: "Provide apiKey and apiSecret in request body or set environment variables",
      },
      { status: 401 }
    );
  }

  try {
    switch (action) {
      case "test": {
        // Test API connection
        const accountInfo = await client.getAccountInfo();
        if (accountInfo.retCode === 0) {
          return NextResponse.json({
            success: true,
            message: "API ключи валидны",
            accountType: accountInfo.result?.unifiedMarginStatus,
          });
        } else {
          return NextResponse.json({
            success: false,
            message: accountInfo.retMsg || "Неверные API ключи",
          });
        }
      }

      case "sync": {
        // Sync trades from Bybit to local database
        const category = (body.category as "linear" | "inverse") || "linear";
        const limit = body.limit || 100;
        const symbol = body.symbol || undefined;

        // Fetch closed PnL from Bybit
        const pnl = await client.getClosedPnL({
          category,
          symbol,
          limit,
        });

        if (pnl.retCode !== 0) {
          throw new Error(pnl.retMsg);
        }

        const bybitTrades = pnl.result.list || [];
        let imported = 0;
        let skipped = 0;

        for (const t of bybitTrades) {
          // Check if trade already exists (by Bybit orderId stored in notes)
          const existing = await db
            .select()
            .from(trades)
            .where(eq(trades.notes, `bybit:${t.orderId}`))
            .limit(1);

          if (existing.length > 0) {
            skipped++;
            continue;
          }

          // Determine direction
          const direction = t.side === "Buy" ? "long" : "short";

          // Calculate prices
          const entryPrice = parseFloat(t.avgEntryPrice);
          const exitPrice = parseFloat(t.avgExitPrice);
          const quantity = parseFloat(t.closedSize);
          const pnlValue = parseFloat(t.closedPnl);

          // Calculate PnL percent
          const entryValue = entryPrice * quantity;
          const pnlPercent = entryValue > 0 ? (pnlValue / entryValue) * 100 : 0;

          // Insert trade
          await db.insert(trades).values({
            ticker: t.symbol,
            direction,
            entryPrice,
            exitPrice,
            quantity,
            fees: 0, // Bybit doesn't provide fees in closed PnL
            pnl: pnlValue,
            pnlPercent,
            notes: `bybit:${t.orderId}`,
            tags: `bybit,${category},${t.leverage}x`,
            entryDate: new Date(parseInt(t.createdTime)),
            exitDate: new Date(parseInt(t.updatedTime)),
          });

          imported++;
        }

        return NextResponse.json({
          success: true,
          imported,
          skipped,
          total: bybitTrades.length,
          message: `Импортировано ${imported} сделок, пропущено ${skipped} (уже существуют)`,
        });
      }

      case "sync-all": {
        // Sync all trades (with pagination)
        const category = (body.category as "linear" | "inverse") || "linear";
        let cursor: string | undefined;
        let totalImported = 0;
        let totalSkipped = 0;
        let iterations = 0;
        const maxIterations = 10; // Limit to prevent infinite loops

        do {
          const pnl = await client.getClosedPnL({
            category,
            limit: 100,
            cursor,
          });

          if (pnl.retCode !== 0) {
            throw new Error(pnl.retMsg);
          }

          const bybitTrades = pnl.result.list || [];

          for (const t of bybitTrades) {
            const existing = await db
              .select()
              .from(trades)
              .where(eq(trades.notes, `bybit:${t.orderId}`))
              .limit(1);

            if (existing.length > 0) {
              totalSkipped++;
              continue;
            }

            const direction = t.side === "Buy" ? "long" : "short";
            const entryPrice = parseFloat(t.avgEntryPrice);
            const exitPrice = parseFloat(t.avgExitPrice);
            const quantity = parseFloat(t.closedSize);
            const pnlValue = parseFloat(t.closedPnl);
            const entryValue = entryPrice * quantity;
            const pnlPercent = entryValue > 0 ? (pnlValue / entryValue) * 100 : 0;

            await db.insert(trades).values({
              ticker: t.symbol,
              direction,
              entryPrice,
              exitPrice,
              quantity,
              fees: 0,
              pnl: pnlValue,
              pnlPercent,
              notes: `bybit:${t.orderId}`,
              tags: `bybit,${category},${t.leverage}x`,
              entryDate: new Date(parseInt(t.createdTime)),
              exitDate: new Date(parseInt(t.updatedTime)),
            });

            totalImported++;
          }

          cursor = pnl.result.nextPageCursor || undefined;
          iterations++;
        } while (cursor && iterations < maxIterations);

        return NextResponse.json({
          success: true,
          imported: totalImported,
          skipped: totalSkipped,
          message: `Импортировано ${totalImported} сделок, пропущено ${totalSkipped}`,
        });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Bybit sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
