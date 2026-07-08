import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { trades } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const allTrades = await db
      .select()
      .from(trades)
      .orderBy(desc(trades.exitDate));
    return NextResponse.json(allTrades);
  } catch (error) {
    console.error("Error fetching trades:", error);
    return NextResponse.json(
      { error: "Failed to fetch trades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ticker,
      direction,
      entryPrice,
      exitPrice,
      quantity,
      fees = 0,
      notes,
      tags,
      entryDate,
      exitDate,
    } = body;

    // Calculate PnL
    const rawPnl =
      direction === "long"
        ? (exitPrice - entryPrice) * quantity
        : (entryPrice - exitPrice) * quantity;
    const pnl = rawPnl - (fees || 0);
    const pnlPercent =
      direction === "long"
        ? ((exitPrice - entryPrice) / entryPrice) * 100
        : ((entryPrice - exitPrice) / entryPrice) * 100;

    const [newTrade] = await db
      .insert(trades)
      .values({
        ticker: ticker.toUpperCase(),
        direction,
        entryPrice: Number(entryPrice),
        exitPrice: Number(exitPrice),
        quantity: Number(quantity),
        fees: Number(fees) || 0,
        pnl,
        pnlPercent,
        notes: notes || null,
        tags: tags || null,
        entryDate: new Date(entryDate),
        exitDate: new Date(exitDate),
      })
      .returning();

    return NextResponse.json(newTrade, { status: 201 });
  } catch (error) {
    console.error("Error creating trade:", error);
    return NextResponse.json(
      { error: "Failed to create trade" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    await db.delete(trades).where(eq(trades.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting trade:", error);
    return NextResponse.json(
      { error: "Failed to delete trade" },
      { status: 500 }
    );
  }
}
