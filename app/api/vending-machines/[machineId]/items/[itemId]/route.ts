import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/db";
import VendingMachine from "@/app/models/vendingMachine.model";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ machineId: string; itemId: string }> }
) {
  const params = await context.params;
  try {
    const { action, quantity } = await request.json();
    const conn = await dbConnect();
    if (!conn) {
      const debugEnv = Object.keys(process.env).sort().join(", ");
      return NextResponse.json(
        {
          error: `Database not configured. Available Env Vars: ${debugEnv}`
        },
        { status: 500 }
      );
    }

    const machine = await VendingMachine.findById(params.machineId);
    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    const item = machine.items.id(params.itemId);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (action === "order" && quantity === 1) {
      // Decrement stock when ordered
      if (item.quantity > 0) {
        item.quantity -= 1;
        await machine.save();
        console.log(
          `Stock updated: ${item.name} quantity now ${item.quantity}`
        );
      } else {
        return NextResponse.json(
          { error: "Item out of stock" },
          { status: 400 }
        );
      }
    } else if (action === "restock") {
      // Add stock during restock
      item.quantity += quantity || 0;
      await machine.save();
      console.log(`Restocked: ${item.name} quantity now ${item.quantity}`);
    }

    const serialized = JSON.parse(JSON.stringify(machine));
    return NextResponse.json(serialized);
  } catch (err) {
    console.error("PATCH /api/vending-machines error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
