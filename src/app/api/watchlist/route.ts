import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const items = await db
      .select()
      .from(watchlist)
      .orderBy(desc(watchlist.priority), desc(watchlist.createdAt));
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, targetPrice, stopLoss, notes, priority } = body;

    const [item] = await db
      .insert(watchlist)
      .values({
        ticker: ticker.toUpperCase(),
        targetPrice: targetPrice ? Number(targetPrice) : null,
        stopLoss: stopLoss ? Number(stopLoss) : null,
        notes: notes || null,
        priority: priority ? Number(priority) : 0,
      })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating watchlist item:", error);
    return NextResponse.json(
      { error: "Failed to create watchlist item" },
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
    await db.delete(watchlist).where(eq(watchlist.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting watchlist item:", error);
    return NextResponse.json(
      { error: "Failed to delete watchlist item" },
      { status: 500 }
    );
  }
}
